export const pythonScriptName = "guacharaca_edl.py";

export const pythonScriptContent = `#!/usr/bin/env python3
"""
Guacharaca Service Suite - Cliente Local de Detección de Hardware en Linux
========================================================================
Prototipo de script en Python para Linux que detecta automáticamente
dispositivos Qualcomm en modo EDL (QDLoader 9008), consulta metadatos
y archivos programadores Firehose desde la base de datos de Supabase, e
inicializa los archivos de inyección para herramientas como QDL o Sahara.

Requerimientos:
  pip3 install pyusb requests python-dotenv

Configuración de Permisos en Linux (Regla UDEV):
  Para ejecutar sin privilegios de root, crear /etc/udev/rules.d/99-qualcomm.rules con:
  SUBSYSTEM=="usb", ATTR{idVendor}=="05c6", ATTR{idProduct}=="9008", MODE="0666", GROUP="plugdev"
"""

import os
import sys
import time
import requests
from dotenv import load_dotenv

# Intentar importar pyusb
try:
    import usb.core
    import usb.util
    PYUSB_AVAILABLE = True
except ImportError:
    PYUSB_AVAILABLE = False
    print("[-] [ADVERTENCIA] Librería 'pyusb' no encontrada.")
    print("    Por favor, instálela con: pip3 install pyusb")

# Cargar variables de entorno de forma segura desde un archivo .env local
# El archivo .env debe contener:
#   SUPABASE_URL=https://tu-proyecto.supabase.co
#   SUPABASE_KEY=tu-api-key-anonima
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def verificar_credenciales():
    """Valida que las credenciales de Supabase existan en el entorno."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[-] [ERROR] Faltan las variables de entorno en el archivo .env")
        print("    Cree un archivo '.env' en el mismo directorio del script:")
        print("    ----------------------------------------")
        print("    SUPABASE_URL=https://xxxx.supabase.co")
        print("    SUPABASE_KEY=tu_anon_key_aqui")
        print("    ----------------------------------------")
        return False
    return True

def buscar_dispositivo_usb():
    """
    Intenta detectar un dispositivo Qualcomm Snapdragon en modo EDL (05c6:9008).
    Utiliza pyusb en primera instancia. Como respaldo, busca en la estructura /sys/ de Linux.
    """
    print("[*] Iniciando monitoreo de puertos USB locales...")
    
    # Método 1: pyusb (Recomendado)
    if PYUSB_AVAILABLE:
        try:
            device = usb.core.find(idVendor=0x05c6, idProduct=0x9008)
            if device is not None:
                print("[+] [USB DETECTADO] Qualcomm HS-USB QDLoader 9008 encontrado!")
                print(f"    Bus: {device.bus:03d} | Device: {device.address:03d}")
                print(f"    Hardware ID: {device.idVendor:04x}:{device.idProduct:04x}")
                return "05c6:9008"
        except usb.core.USBError as e:
            if "Access denied" in str(e):
                print("[-] [ERROR DE PERMISOS] Acceso denegado al dispositivo USB.")
                print("    Solución: Ejecute como root (sudo) o configure las reglas UDEV necesarias.")
            else:
                print(f"[-] [ERROR USB] {e}")

    # Método 2: Escaneo de sistema de archivos /sys/bus/usb/ (Respaldo en Linux)
    print("[*] Buscando en registros de buses USB locales de Linux (/sys/)...")
    try:
        import glob
        for path in glob.glob('/sys/bus/usb/devices/*/uevent'):
            try:
                with open(path, 'r') as f:
                    content = f.read()
                    if "PRODUCT=5c6/9008" in content or "PRODUCT=05c6/9008" in content:
                        print("[+] [SISTEMA DETECTADO] Qualcomm EDL detected en adaptador interno de Linux.")
                        return "05c6:9008"
            except Exception:
                continue
    except Exception as e:
        print(f"[-] Error al escanear /sys: {e}")

    print("[-] No se detectaron dispositivos Qualcomm en modo EDL (05c6:9008).")
    return None

def obtener_recursos_desde_supabase(chipset_id):
    """
    Hace peticiones seguras a la API REST de Supabase para obtener el programador
    Firehose (.elf) y las notas técnicas asociadas al chipset USB EDL 05c6:9008.
    """
    print(f"[*] Consultando recursos en base de datos Supabase para el chipset: {chipset_id}...")
    
    # Encabezados de seguridad exigidos por la API REST de Supabase-PostgREST
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    # 1. Obtener la información del dispositivo
    url_dispositivos = f"{SUPABASE_URL}/rest/v1/dispositivos?chipset_id=eq.{chipset_id}&select=*"
    try:
        response = requests.get(url_dispositivos, headers=headers)
        if response.status_code != 200:
            print(f"[-] Error al consultar dispositivos (HTTP {response.status_code}): {response.text}")
            return None
        
        dispositivos = response.json()
        if not dispositivos:
            print(f"[-] No se encontró ningún modelo registrado para el chipset: {chipset_id}")
            return None
            
        disp = dispositivos[0]
        print(f"[+] [DISPOSITIVO ENCONTRADO] {disp['marca']} {disp['modelo']} (Procesador: {disp['procesador']})")
        
        # 2. Obtener recursos técnicos (Firehose, Test Points etc) asociados
        url_recursos = f"{SUPABASE_URL}/rest/v1/recursos_tecnicos?dispositivo_id=eq.{disp['id']}&select=*"
        response_rec = requests.get(url_recursos, headers=headers)
        if response_rec.status_code == 200:
            recursos = response_rec.json()
            return {
                "dispositivo": disp,
                "recursos": recursos
            }
        else:
            print(f"[-] Error al consultar recursos técnicos: {response_rec.status_code}")
            return None
            
    except Exception as e:
        print(f"[-] Excepción durante la conexión a Supabase: {e}")
        return None

def descargar_archivo_temporal(url_archivo, nombre_salida="prog_firehose.elf"):
    """
    Descarga el programador Firehose temporalmente en la carpeta /tmp/ del sistema Linux.
    Este archivo está listo para ser inyectado por herramientas de bajo nivel como qdl.
    """
    ruta_temporal = os.path.join("/tmp", nombre_salida)
    print(f"[*] Descargando programador Firehose desde: {url_archivo}...")
    
    try:
        response = requests.get(url_archivo, stream=True)
        if response.status_code == 200:
            with open(ruta_temporal, "wb") as f:
                for chunk in response.iter_content(chunk_size=1024):
                    if chunk:
                        f.write(chunk)
            print(f"[+] [DESCARGA EXITOSA] Guardado en: {ruta_temporal}")
            print(f"[+] Archivo preparado para inyección.")
            return ruta_temporal
        else:
            print(f"[-] Código de error de descarga: {response.status_code}")
            return None
    except Exception as e:
        print(f"[-] Error al guardar archivo de programador: {e}")
        return None

def ejecutar_suite():
    if not verificar_credenciales():
        sys.exit(1)
        
    chipset = buscar_dispositivo_usb()
    if not chipset:
        print("[!] Conecte un dispositivo Qualcomm EDL en puertos USB del PC y corra el script nuevamente.")
        sys.exit(0)
        
    resultado = obtener_recursos_desde_supabase(chipset)
    if resultado:
        disp = resultado["dispositivo"]
        recursos = resultado["recursos"]
        
        print("\n" + "="*50)
        print(f" GUACHARACA SERVICE SUITE - METADATOS COMPATIBLES")
        print("="*50)
        print(f" Marca:       {disp['marca']}")
        print(f" Modelo:      {disp['modelo']}")
        print(f" Procesador:  {disp['procesador']}")
        print(f" Chipset ID:  {disp['chipset_id']}")
        print("-"*50)
        
        firehose_url = None
        for rec in recursos:
            tipo = rec["tipo_recurso"]
            url = rec["url_archivo"]
            notas = rec.get("notas_tecnicas", "Sin notas.")
            print(f"[Recurso: {tipo.upper()}] URL: {url}")
            print(f"   Notas: {notas}\n")
            if tipo == "firehose":
                firehose_url = url
                
        if firehose_url:
            archivo_local = descargar_archivo_temporal(firehose_url, f"prog_firehose_{disp['modelo'].replace(' ', '_').lower()}.elf")
            if archivo_local:
                print("\n[+] [LISTO PARA INYECCIÓN]")
                print(f"    Comando listo de inyección sugerido para Linux:")
                print(f"    $ qdl --firehose {archivo_local} --rawprogram rawprogram0.xml --patch patch0.xml")
        else:
            print("[-] [ERROR] No se localizó ningún recurso de tipo 'firehose' para este dispositivo.")
    else:
        print("[-] No se pudieron recuperar recursos para el dispositivo de hardware detectado.")

if __name__ == "__main__":
    print("==================================================")
    print(" Guacharaca Service Suite - Monitor Local v1.0.0 ")
    print("==================================================")
    ejecutar_suite()
`;
