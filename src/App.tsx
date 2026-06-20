import { useState, useEffect, useRef, FormEvent } from 'react';
import { 
  Cpu, 
  Layers, 
  Terminal, 
  Database, 
  Key, 
  FileCode, 
  Settings, 
  Download, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  Smartphone, 
  Usb, 
  AlertCircle, 
  CheckCircle2, 
  HardDrive, 
  Info, 
  ExternalLink,
  BookOpen,
  FileCheck,
  RefreshCw,
  Search,
  BookMarked,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dispositivo, RecursoTecnico, AuditLog } from './types';
import { initialDispositivos, initialRecursosTecnicos, initialSqlSchema } from './data/initialData';
import { pythonScriptName, pythonScriptContent } from './data/pythonScriptText';

export default function App() {
  // Configuración de Estados Locales
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>(() => {
    const saved = localStorage.getItem('guacharaca_dispositivos');
    return saved ? JSON.parse(saved) : initialDispositivos;
  });

  const [recursosTecnicos, setRecursosTecnicos] = useState<RecursoTecnico[]>(() => {
    const saved = localStorage.getItem('guacharaca_recursos');
    return saved ? JSON.parse(saved) : initialRecursosTecnicos;
  });

  const [logsAuditoria, setLogsAuditoria] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('guacharaca_logs');
    return saved ? JSON.parse(saved) : [
      {
        id: "log-1",
        dispositivo_id: 1,
        imei: "863489051122345",
        cliente_nombre: "María Alejandra Páez",
        cliente_documento: "V-24.112.983",
        motivo_servicio: "Recuperación de datos por brickeo de actualización OTA oficial",
        timestamp: "2026-06-20T10:05:00Z",
        estado: "Completado"
      }
    ];
  });

  // Persistencia Local
  useEffect(() => {
    localStorage.setItem('guacharaca_dispositivos', JSON.stringify(dispositivos));
  }, [dispositivos]);

  useEffect(() => {
    localStorage.setItem('guacharaca_recursos', JSON.stringify(recursosTecnicos));
  }, [recursosTecnicos]);

  useEffect(() => {
    localStorage.setItem('guacharaca_logs', JSON.stringify(logsAuditoria));
  }, [logsAuditoria]);

  // Estados de navegación
  const [activeTab, setActiveTab] = useState<'detector' | 'database' | 'python' | 'testpoints' | 'auditoria' | 'sql'>('detector');

  // Credenciales Simuladas para la Guía Técnica
  const [localEnv, setLocalEnv] = useState({
    SUPABASE_URL: "https://guacharaca-db.supabase.co",
    SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1YWNoYXJhY2EiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4MDk1MzYwMCwiZXhwIjoyMDk2NTEyMDAwfQ.sP3g_GuacharacaSecuredKeyDemoInsideAppletWeb",
  });

  // Estado del Simulador de Hardware (EDL Loop)
  const [hardwareId, setHardwareId] = useState<string | null>(null);
  const [currentDeviceSelected, setCurrentDeviceSelected] = useState<number>(1); // default Xiaomi Redmi Note 12
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[*] Guacharaca Service Suite v1.0.0 listo.",
    "[*] Para comenzar la simulación, seleccione un dispositivo y presione 'Simular Conexión USB EDL (05c6:9008)'."
  ]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedProgress, setSimulatedProgress] = useState<number | null>(null);
  const [downloadedFiles, setDownloadedFiles] = useState<{name: string, size: string, timestamp: string}[]>([]);
  const [copiedState, setCopiedState] = useState<{ [key: string]: boolean }>({});

  // Buscador para tablas de base de datos
  const [dbSearch, setDbSearch] = useState("");

  // Formulario para nuevo dispositivo
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newProcessor, setNewProcessor] = useState("");
  const [newChipset, setNewChipset] = useState("05c6:9008");
  const [showAddForm, setShowAddForm] = useState(false);

  // Formulario para nuevo recurso
  const [assocDispositivoId, setAssocDispositivoId] = useState<number>(1);
  const [recursoTipo, setRecursoTipo] = useState<'firehose' | 'test_point' | 'preloader'>('firehose');
  const [recursoUrl, setRecursoUrl] = useState("");
  const [recursoNotas, setRecursoNotas] = useState("");
  const [showRecursoForm, setShowRecursoForm] = useState(false);

  // Formulario de auditoría legal
  const [auditImei, setAuditImei] = useState("");
  const [auditDispositivo, setAuditDispositivo] = useState<number>(1);
  const [auditCliente, setAuditCliente] = useState("");
  const [auditDoc, setAuditDoc] = useState("");
  const [auditMotivo, setAuditMotivo] = useState("");
  const [auditSuccessMsg, setAuditSuccessMsg] = useState(false);

  // Selector para Testpoint Guide
  const [testpointDeviceSelected, setTestpointDeviceSelected] = useState<number>(1);

  // Automatismo para bajarse a un terminal sutil al añadir logs
  const terminalEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  // Copiador de portapapeles genérico
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedState(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedState(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  // Algoritmo de simulación del terminal de Linux y conexión a Supabase
  const startSimulation = (type: 'pyusb' | 'sys') => {
    if (isSimulating) return;
    
    setIsSimulating(true);
    setTerminalLogs([]);
    setHardwareId(null);
    setSimulatedProgress(0);

    const steps = [
      { text: "==================================================", delay: 100 },
      { text: " GUACHARACA SERVICE SUITE - SIMULADOR CLIENTE LOCAL", delay: 150 },
      { text: "==================================================", delay: 100 },
      { text: `[*] Iniciando servicio daemon local sobre GNU/Linux...`, delay: 400 },
      { text: `[*] Comprobando variables de entorno en el script local...`, delay: 500 },
      { text: `    SUPABASE_URL = "${localEnv.SUPABASE_URL}"`, delay: 100 },
      { text: `    SUPABASE_KEY = "${localEnv.SUPABASE_KEY.substring(0, 20)}... (Protegido)"`, delay: 100 },
      { text: `[+] [OK] Credenciales del archivo .env cargadas adecuadamente.`, delay: 300 },
      { text: `[*] Iniciando escaneo de hardware local de puertos USB en reposo...`, delay: 600 }
    ];

    let currentStep = 0;
    const runSteps = () => {
      if (currentStep < steps.length) {
        setTerminalLogs(prev => [...prev, steps[currentStep].text]);
        setTimeout(() => {
          currentStep++;
          runSteps();
        }, steps[currentStep].delay);
      } else {
        // Ejecutar simulación de detección real
        simulateDetección(type);
      }
    };
    runSteps();
  };

  const simulateDetección = (type: 'pyusb' | 'sys') => {
    const selectedDisp = dispositivos.find(d => d.id === currentDeviceSelected);
    if (!selectedDisp) {
      setTerminalLogs(prev => [...prev, "[-] Error: Dispositivo de datos de origen no encontrado en catálogo.", "[-] Abortado."]);
      setIsSimulating(false);
      return;
    }

    setTimeout(() => {
      if (type === 'pyusb') {
        setTerminalLogs(prev => [...prev, 
          `[*] [MÉTODO pyusb] Invocando usb.core.find(idVendor=0x05c6, idProduct=0x9008)...`,
          `[+] [HARDWARE MATCH] ¡Se encontró un dispositivo Qualcomm HS-USB QDLoader 9008 conectado!`,
          `    - Dirección física en Bus: Bus 002 Device 008`,
          `    - IDs Técnicos: Hardware VID: 05C6 | PID: 9008`
        ]);
      } else {
        setTerminalLogs(prev => [...prev, 
          `[*] [MÉTODO fallback de lectura /sys] Inspeccionando ficheros '/sys/bus/usb/devices/*/uevent'...`,
          `[+] [SISTEMA LOG COMPATIBLE] Match de uevent para dispositivo Qualcomm EDL:`,
          `    Path: /sys/bus/usb/devices/2-1.3/uevent`,
          `    Contenido del descriptor: PRODUCT=05c6/9008/0`,
          `[+] ¡Qualcomm HS-USB en estado EDL 9008 mapeado con éxito!`
        ]);
      }
      setHardwareId("05c6:9008");
      setSimulatedProgress(25);
    }, 1000);

    setTimeout(() => {
      setTerminalLogs(prev => [...prev, 
        `[*] Realizando conexión HTTPS REST a Supabase PostgREST...`,
        `    Endpoint transaccional: ${localEnv.SUPABASE_URL}/rest/v1/dispositivos?chipset_id=eq.05c6:9008`,
        `[*] Consultando modelo compatible con Id de hardware: 05c6:9008...`
      ]);
      setSimulatedProgress(50);
    }, 2200);

    setTimeout(() => {
      setTerminalLogs(prev => [...prev, 
        `[+] [OK] Modelo localizado con éxito en base de datos PostgreSQL de Supabase:`,
        `    - Modelo: ${selectedDisp.marca} ${selectedDisp.modelo}`,
        `    - Procesador: ${selectedDisp.procesador}`,
        `    - Identificador Único DB: BIGINT ID = ${selectedDisp.id}`,
        `[*] Consultando recursos técnicos (Firehoses, Esquemas de Test Point) de forma indexada...`,
        `    Endpoint transaccional: ${localEnv.SUPABASE_URL}/rest/v1/recursos_tecnicos?dispositivo_id=eq.${selectedDisp.id}`
      ]);
      setSimulatedProgress(70);
    }, 3500);

    setTimeout(() => {
      const associatedRecs = recursosTecnicos.filter(r => r.dispositivo_id === selectedDisp.id);
      if (associatedRecs.length === 0) {
        setTerminalLogs(prev => [...prev, 
          `[-] [ERROR] No se encontraron archivos técnicos para ${selectedDisp.marca} ${selectedDisp.modelo} en Supabase.`,
          `    Regístrelos en la pestaña de 'Base de Datos' primero.`,
          `[-] Finalizado de forma incompleta.`
        ]);
        setSimulatedProgress(100);
        setIsSimulating(false);
        return;
      }

      setTerminalLogs(prev => [...prev, 
        `[+] Se localizaron ${associatedRecs.length} recursos vinculados en BD:`
      ]);

      associatedRecs.forEach(rec => {
        setTerminalLogs(prev => [...prev, 
          `    - Tipo: [${rec.tipo_recurso.toUpperCase()}] | URL: ${rec.url_archivo}`,
          `      Notas Técnicas: "${rec.notas_tecnicas}"`
        ]);
      });

      const firehose = associatedRecs.find(r => r.tipo_recurso === 'firehose');
      if (firehose) {
        setTerminalLogs(prev => [...prev, 
          `[*] Iniciando proceso de descarga del binario Firehose ELF para inicialización...`,
          `    Origen remoto: ${firehose.url_archivo}`,
          `    Destino seguro temporal: /tmp/prog_firehose_${selectedDisp.modelo.replace(/ /g, "_").toLowerCase()}.elf`
        ]);
        setSimulatedProgress(85);

        // Retardo para descarga
        setTimeout(() => {
          const expectedFilename = `prog_firehose_${selectedDisp.modelo.replace(/ /g, "_").toLowerCase()}.elf`;
          setTerminalLogs(prev => [...prev, 
            `[+] [DESCARGA COMPLETADA] Guardado con éxito en disco local.`,
            `    Ruta final: /tmp/${expectedFilename}`,
            `    Peso binario: 612 KB (Cargador Firehose ELF válido)`,
            `==================================================`,
            `[+] [GUACHARACA SUCCESS] ¡Proceso de Handshake USB y preparación completado!`,
            `==================================================`,
            `[SUGERENCIA DE EJECUCIÓN] El cargador ya está listo en el sistema local Linux.`,
            `Puede inyectarlo localmente con herramientas libres de terminal:`,
            `$ qdl --firehose /tmp/${expectedFilename} --rawprogram rawprogram0.xml --patch patch0.xml`,
            `o con btools:`,
            `$ python3 -m mtkclient --loader /tmp/${expectedFilename} --action read_gpt`,
            `[*] Esperando nueva conexión de hardware local...`
          ]);

          const isFileAlreadyInList = downloadedFiles.some(f => f.name === expectedFilename);
          if (!isFileAlreadyInList) {
            setDownloadedFiles(prev => [
              ...prev, 
              { 
                name: expectedFilename, 
                size: "612 KB", 
                timestamp: new Date().toLocaleTimeString() 
              }
            ]);
          }

          setSimulatedProgress(100);
          setIsSimulating(false);
        }, 1500);

      } else {
        setTerminalLogs(prev => [...prev, 
          `[-] [WARN] No se detectó ningún recurso de tipo 'firehose' registrado para este modelo.`,
          `    El software requiere un archivo Firehose cargador para continuar la inyección de bypass.`,
          `[-] Proceso detenido.`
        ]);
        setSimulatedProgress(100);
        setIsSimulating(false);
      }

    }, 4800);
  };

  // Funciones CRUD simuladas para nuestra base de datos
  const handleAddDispositivo = (e: FormEvent) => {
    e.preventDefault();
    if (!newBrand || !newModel || !newProcessor) return;

    const newId = dispositivos.length > 0 ? Math.max(...dispositivos.map(d => d.id)) + 1 : 1;
    const item: Dispositivo = {
      id: newId,
      marca: newBrand,
      modelo: newModel,
      procesador: newProcessor,
      chipset_id: newChipset,
      created_at: new Date().toISOString()
    };

    setDispositivos(prev => [...prev, item]);
    setNewBrand("");
    setNewModel("");
    setNewProcessor("");
    setShowAddForm(false);

    // Agregar log al terminal de que se actualizó la BD localmente para el simulador
    setTerminalLogs(prev => [
      ...prev, 
      `[*] [DB UPDATE] Nuevo dispositivo añadido: ${item.marca} ${item.modelo} [ID: ${item.id}]`
    ]);
  };

  const handleAddRecurso = (e: FormEvent) => {
    e.preventDefault();
    if (!recursoUrl) return;

    const newId = recursosTecnicos.length > 0 ? Math.max(...recursosTecnicos.map(r => r.id)) + 1 : 101;
    const item: RecursoTecnico = {
      id: newId,
      dispositivo_id: Number(assocDispositivoId),
      tipo_recurso: recursoTipo,
      url_archivo: recursoUrl,
      notas_tecnicas: recursoNotas || "Sin especificaciones técnicas adicionales."
    };

    setRecursosTecnicos(prev => [...prev, item]);
    setRecursoUrl("");
    setRecursoNotas("");
    setShowRecursoForm(false);

    const relatedDis = dispositivos.find(d => d.id === Number(assocDispositivoId));
    setTerminalLogs(prev => [
      ...prev, 
      `[*] [DB UPDATE] Recurso '${item.tipo_recurso}' enlazado al dispositivo: ${relatedDis?.marca} ${relatedDis?.modelo}`
    ]);
  };

  const handleDeleteDispositivo = (id: number) => {
    // Eliminar dispositivo y sus recursos
    setDispositivos(prev => prev.filter(d => d.id !== id));
    setRecursosTecnicos(prev => prev.filter(r => r.dispositivo_id !== id));
    setTerminalLogs(prev => [...prev, `[*] [DB DELETE] Dispositivo removido del catálogo [ID: ${id}]`]);
  };

  const handleDeleteRecurso = (id: number) => {
    setRecursosTecnicos(prev => prev.filter(r => r.id !== id));
    setTerminalLogs(prev => [...prev, `[*] [DB DELETE] Recurso técnico removido [ID: ${id}]`]);
  };

  // Formulario Auditoría de Seguridad Legal
  const handleAddAuditLog = (e: FormEvent) => {
    e.preventDefault();
    if (!auditImei || !auditCliente || !auditDoc) return;

    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      dispositivo_id: Number(auditDispositivo),
      imei: auditImei,
      cliente_nombre: auditCliente,
      cliente_documento: auditDoc,
      motivo_servicio: auditMotivo || "Desbloqueo de terminal por olvido de contraseña",
      timestamp: new Date().toISOString(),
      estado: "Completado"
    };

    setLogsAuditoria(prev => [newLog, ...prev]);
    setAuditImei("");
    setAuditCliente("");
    setAuditDoc("");
    setAuditMotivo("");
    setAuditSuccessMsg(true);
    setTimeout(() => setAuditSuccessMsg(false), 3000);

    const disp = dispositivos.find(d => d.id === Number(auditDispositivo));
    // Escribir en la terminal también para el realismo
    setTerminalLogs(prev => [
      ...prev,
      `[+] [AUDITORÍA DE VINCULACIÓN LEGAL] IMEI: ${newLog.imei} enlazado con éxito a ${auditCliente} (${auditDoc}) para el equipo ${disp?.marca} ${disp?.modelo}. Registro firmado criptográficamente.`
    ]);
  };

  // Filtrado de la Base de datos en la web
  const filteredDispositivos = dispositivos.filter(d => {
    const searchString = `${d.marca} ${d.modelo} ${d.procesador} ${d.chipset_id}`.toLowerCase();
    return searchString.includes(dbSearch.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* HEADER PRINCIPAL */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-500/5">
              <Cpu className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white font-mono">GUACHARACA</h1>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono border border-emerald-500/20">Service Suite</span>
              </div>
              <p className="text-xs text-zinc-400">Entorno de Prototipado, Monitoreo EDL 9008 y Gestión de Recursos para Linux</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs bg-zinc-800/40 p-1.5 rounded-lg border border-zinc-700/50 font-mono">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-900/60 text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Daemon: Activo</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-900/60 text-zinc-300">
              <span>Portapapeles:</span>
              <span className="text-emerald-400 font-bold">Listos</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-900/60 text-emerald-400">
              <HardDrive className="h-3 w-3" />
              <span>/tmp/</span>
              <span className="text-white">({downloadedFiles.length} cargados)</span>
            </div>
          </div>
        </div>
      </header>

      {/* RIEGO DE ALERTA DE PRESENTACIÓN DE RESPONSABILIDAD ANTE GARANTÍA DE LEY (VENEZUELA/LATAM) */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-indigo-950/40 border-b border-emerald-500/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldAlert className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>
              <strong>Visión y Ética Profesional:</strong> Respaldamos la independencia técnica eliminando la dependencia de cajas comerciales caras. Registro de auditoría integrado para transparencia legal.
            </span>
          </div>
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-mono">
            Linux Native Protocol
          </span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        
        {/* NAVEGACIÓN DE VISTAS */}
        <div className="flex overflow-x-auto gap-1 border-b border-zinc-800/80 pb-4 mb-6 scrollbar-thin scrollbar-thumb-zinc-800">
          <button 
            onClick={() => setActiveTab('detector')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all shrink-0 font-mono ${activeTab === 'detector' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}
          >
            <Terminal className="h-4 w-4" />
            1. Consola EDL 9008
          </button>
          <button 
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all shrink-0 font-mono ${activeTab === 'database' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}
          >
            <Database className="h-4 w-4" />
            2. Base de Datos Supabase
          </button>
          <button 
            onClick={() => setActiveTab('python')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all shrink-0 font-mono ${activeTab === 'python' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}
          >
            <FileCode className="h-4 w-4" />
            3. Script Python Local & .env
          </button>
          <button 
            onClick={() => setActiveTab('testpoints')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all shrink-0 font-mono ${activeTab === 'testpoints' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}
          >
            <BookMarked className="h-4 w-4" />
            4. Guía de Test Points
          </button>
          <button 
            onClick={() => setActiveTab('auditoria')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all shrink-0 font-mono ${activeTab === 'auditoria' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}
          >
            <FileCheck className="h-4 w-4" />
            5. Logs de Auditoría Legal
          </button>
          <button 
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all shrink-0 font-mono ${activeTab === 'sql' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}
          >
            <Key className="h-4 w-4" />
            6. Estructuras SQL
          </button>
        </div>

        {/* CONTAINER DINÁMICO */}
        <div id="guacharaca-app-body" className="min-h-[500px]">
          <AnimatePresence mode="wait">
            
            {/* VISTA 1: DETECTOR Y CONSOLA */}
            {activeTab === 'detector' && (
              <motion.div 
                key="detector-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                
                {/* PANEL DE CONTROL DE SELECCIÓN */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2 font-mono uppercase tracking-wider text-emerald-400">
                      <Settings className="h-4 w-4" />
                      Inicializador de Dispositivo
                    </h3>
                    <p className="text-xs text-zinc-400 mb-4">
                      Simula la conexión de un dispositivo físico de los registrados en el servidor para lanzar la petición a Supabase y descargar su cargador.
                    </p>

                    <label className="block text-xs text-zinc-400 mb-1.5 font-mono">Seleccionar Dispositivo Objetivo:</label>
                    <div className="space-y-2 mb-4">
                      {dispositivos.map((d) => (
                        <div 
                          key={d.id} 
                          onClick={() => !isSimulating && setCurrentDeviceSelected(d.id)}
                          className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${currentDeviceSelected === d.id ? 'bg-emerald-500/10 border-emerald-500 text-white' : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-750'}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-sm block">{d.marca} {d.modelo}</span>
                            <span className="text-[10px] bg-zinc-800 text-zinc-300 font-mono px-2 py-0.5 rounded">
                              {d.procesador}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-500 font-mono block mt-1">VID:PID: {d.chipset_id}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => startSimulation('pyusb')}
                        disabled={isSimulating}
                        className={`w-full py-2.5 px-4 rounded-lg font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${isSimulating ? 'bg-zinc-800 text-zinc-500' : 'bg-emerald-500 hover:bg-emerald-600 text-black shadow-md shadow-emerald-500/15'}`}
                      >
                        <Usb className="h-4 w-4" />
                        Simular EDL vía PyUSB (MÉTODO 1)
                      </button>

                      <button
                        onClick={() => startSimulation('sys')}
                        disabled={isSimulating}
                        className={`w-full py-2 px-4 rounded-lg font-mono text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-zinc-700 bg-zinc-950 hover:bg-zinc-900 text-zinc-300`}
                      >
                        <Layers className="h-3.5 w-3.5" />
                        Simular Fallback /sys/ (MÉTODO 2)
                      </button>
                    </div>
                  </div>

                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2 font-mono uppercase tracking-wider text-emerald-400">
                      <HardDrive className="h-4 w-4" />
                      Directorio Temporal (/tmp)
                    </h3>
                    <p className="text-xs text-zinc-400 mb-3">
                      Archivos descargados en el sistema de archivos temporal listos para inyección en Linux mediante Sahara/Firehose.
                    </p>

                    {downloadedFiles.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-zinc-800 rounded-lg text-zinc-500 text-xs">
                        No hay archivos descargados todavía.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {downloadedFiles.map((file, idx) => (
                          <div key={idx} className="bg-zinc-950 p-2.5 rounded border border-zinc-800 text-xs font-mono flex justify-between items-center">
                            <div>
                              <span className="text-emerald-400 block break-all">{file.name}</span>
                              <span className="text-[10px] text-zinc-500 block">Tamaño: {file.size} | Guardado: {file.timestamp}</span>
                            </div>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono select-none">
                              LISTO
                            </span>
                          </div>
                        ))}
                        <button
                          onClick={() => setDownloadedFiles([])}
                          className="w-full text-center text-[11px] text-zinc-500 hover:text-red-400 cursor-pointer pt-2 font-mono flex items-center justify-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Limpiar directorio temporal
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* CONSOLA DE TERMINAL LINUX */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex-1 flex flex-col shadow-2xl">
                    
                    {/* Cabecera Terminal */}
                    <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 font-mono">
                        <Terminal className="h-4 w-4 text-emerald-400" />
                        <span className="text-zinc-300 font-bold">guacharaca@linux-workbench: ~</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                        <span>05c6:9008 EDL Monitor daemon</span>
                      </div>
                    </div>

                    {/* Cuerpo logs terminal */}
                    <div className="p-4 bg-zinc-950 font-mono text-xs leading-relaxed overflow-y-auto space-y-1.5 min-h-[400px] max-h-[500px]">
                      {terminalLogs.map((log, index) => {
                        let color = "text-zinc-300";
                        if (log.startsWith("[+]")) color = "text-emerald-400 font-medium";
                        if (log.startsWith("[-]")) color = "text-rose-400";
                        if (log.startsWith("[*]")) color = "text-cyan-400";
                        if (log.startsWith("[!]") || log.includes("ADVERTENCIA")) color = "text-sky-300";
                        if (log.startsWith(" GUACHARACA") || log.startsWith(" GUACHARACA SERVICE")) color = "text-emerald-300 font-bold bg-emerald-950/20";
                        if (log.startsWith("==========") || log.startsWith("----------")) color = "text-zinc-600";
                        if (log.startsWith("    -") || log.startsWith("    UP") || log.startsWith("    EP")) color = "text-zinc-400";
                        
                        return (
                          <div key={index} className={`whitespace-pre-wrap ${color}`}>
                            {log}
                          </div>
                        );
                      })}
                      {isSimulating && (
                        <div className="flex items-center gap-2 text-zinc-500 animate-pulse mt-3">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Procesando petición en tiempo real...</span>
                        </div>
                      )}
                      <div ref={terminalEndRef}></div>
                    </div>

                    {/* Barra de estado con progreso simulado */}
                    {simulatedProgress !== null && (
                      <div className="bg-zinc-950 px-4 py-2 border-t border-zinc-800">
                        <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-1 font-mono">
                          <span>Estado del Handshake & Consulta REST SQL:</span>
                          <span className="font-semibold text-emerald-400">{simulatedProgress}%</span>
                        </div>
                        <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${simulatedProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Panel de Atajos e Instrucciones Rápidas */}
                  <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-4 flex gap-3 text-xs text-zinc-400">
                    <Info className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-zinc-300 font-semibold mb-1">¿Qué está sucediendo internamente bajo el capó?</p>
                      <p className="mb-2">
                        El script emulado monitorea activamente el bus USB mediante descriptores virtuales del sistema operativo Linux. En cuanto reconoce el chipset ID <span className="font-mono text-zinc-300">05c6:9008</span>, autentica mediante cabeceras CORS en Supabase, extrae el archivo programador <span className="text-emerald-400">prog_firehose.elf</span> de la URL almacenada y lo descarga para alimentar al cargador de Linux de inmediato.
                      </p>
                      <button 
                        onClick={() => setActiveTab('python')}
                        className="text-emerald-300 font-mono text-[11px] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Ver el código fuente original en Python <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {/* VISTA 2: BASE DE DATOS SUPABASE (INTERACTIVA) */}
            {activeTab === 'database' && (
              <motion.div 
                key="database-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-emerald-400" />
                        <h2 className="text-lg font-bold text-white">Visualizador de Base de Datos (Supabase)</h2>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        Sincronización bidireccional simulada para la consola. Los cambios añadidos o eliminados afectarán de inmediato la detección del dispositivo en la pestaña anterior.
                      </p>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                      <div className="bg-zinc-950 border border-zinc-800 rounded-lg flex items-center px-3 py-1.5 text-xs flex-1 md:w-64">
                        <Search className="h-4 w-4 text-zinc-500 mr-2 shrink-0" />
                        <input 
                          type="text" 
                          placeholder="Buscar dispositivo o chip..."
                          value={dbSearch}
                          onChange={(e) => setDbSearch(e.target.value)}
                          className="bg-transparent border-none text-zinc-200 focus:outline-none w-full"
                        />
                      </div>

                      <button
                        onClick={() => {
                          setDispositivos(initialDispositivos);
                          setRecursosTecnicos(initialRecursosTecnicos);
                          setTerminalLogs(prev => [...prev, "[*] Base de datos restablecida a los valores SQL por defecto."]);
                        }}
                        className="py-1.5 px-3 border border-zinc-700 hover:border-zinc-500 bg-zinc-900 rounded-lg text-xs font-mono font-medium flex items-center gap-1 cursor-pointer"
                        title="Restaurar a datos de ejemplo de Xiaomi Redmi Note 12"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* TABLA PRINCIPAL: DISPOSITIVOS */}
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5" />
                        Tabla: `dispositivos` ({filteredDispositivos.length} registrados)
                      </h3>
                      <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="py-1 px-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded text-xs flex items-center gap-1 font-mono cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Añadir Dispositivo (SQL INSERT)
                      </button>
                    </div>

                    {/* FORMULARIO DISPOSITIVO */}
                    {showAddForm && (
                      <form onSubmit={handleAddDispositivo} className="bg-zinc-950 p-4 border border-zinc-800 rounded-lg space-y-3">
                        <h4 className="text-xs font-bold text-white font-mono">Nuevo Registro de Dispositivo</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[10px] text-zinc-500 font-mono mb-1">Marca*</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="Ej: Xiaomi" 
                              value={newBrand}
                              onChange={(e) => setNewBrand(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 font-mono mb-1">Modelo*</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="Ej: Redmi Note 12 4G" 
                              value={newModel}
                              onChange={(e) => setNewModel(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 font-mono mb-1">Procesador*</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="Ej: Snapdragon 685" 
                              value={newProcessor}
                              onChange={(e) => setNewProcessor(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 font-mono mb-1">Chipset ID*</label>
                            <input 
                              type="text" 
                              required 
                              value={newChipset}
                              onChange={(e) => setNewChipset(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500/50"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 text-xs pt-1">
                          <button 
                            type="button" 
                            onClick={() => setShowAddForm(false)}
                            className="px-3 py-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="submit" 
                            className="px-3 py-1 bg-emerald-500 text-black font-semibold rounded hover:bg-emerald-600 font-mono cursor-pointer"
                          >
                            INSERT INTO dispositivos
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="overflow-x-auto border border-zinc-800 rounded-lg">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-zinc-950 border-b border-zinc-800 font-mono text-zinc-400">
                            <th className="p-3">ID</th>
                            <th className="p-3">Marca</th>
                            <th className="p-3">Modelo</th>
                            <th className="p-3">Procesador</th>
                            <th className="p-3 font-mono">Chipset ID</th>
                            <th className="p-3 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-850">
                          {filteredDispositivos.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-zinc-500">
                                Ningún dispositivo coincide con la búsqueda.
                              </td>
                            </tr>
                          ) : (
                            filteredDispositivos.map((d) => (
                              <tr key={d.id} className="hover:bg-zinc-900/30">
                                <td className="p-3 font-mono text-zinc-400">{d.id}</td>
                                <td className="p-3 font-semibold text-white">{d.marca}</td>
                                <td className="p-3 text-zinc-200">{d.modelo}</td>
                                <td className="p-3 text-zinc-300">
                                  <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-[11px] font-mono">
                                    {d.procesador}
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-emerald-400">{d.chipset_id}</td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => handleDeleteDispositivo(d.id)}
                                    className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer transition-colors"
                                    title="Eliminar dispositivo y sus recursos"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* TABLA: RECURSOS TECNICOS */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                        <Database className="h-3.5 w-3.5" />
                        Tabla: `recursos_tecnicos` ({recursosTecnicos.length} de forma anidada)
                      </h3>
                      <button
                        onClick={() => {
                          if (dispositivos.length > 0) {
                            setAssocDispositivoId(dispositivos[0].id);
                          }
                          setShowRecursoForm(!showRecursoForm);
                        }}
                        className="py-1 px-2.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 rounded text-xs flex items-center gap-1 font-mono cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Asociar Recurso (.ELF / TP)
                      </button>
                    </div>

                    {/* FORMULARIO RECURSO */}
                    {showRecursoForm && (
                      <form onSubmit={handleAddRecurso} className="bg-zinc-950 p-4 border border-zinc-800 rounded-lg space-y-3">
                        <h4 className="text-xs font-bold text-white font-mono">Nuevo Recurso Técnico de Reparación</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] text-zinc-500 font-mono mb-1">Dispositivo Asociado*</label>
                            <select 
                              value={assocDispositivoId}
                              onChange={(e) => setAssocDispositivoId(Number(e.target.value))}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                            >
                              {dispositivos.map(d => (
                                <option key={d.id} value={d.id}>{d.marca} {d.modelo}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 font-mono mb-1">Tipo de Recurso*</label>
                            <select 
                              value={recursoTipo}
                              onChange={(e) => setRecursoTipo(e.target.value as any)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                            >
                              <option value="firehose">Firehose Loader (.elf)</option>
                              <option value="test_point">Test Point Diagram (.jpg)</option>
                              <option value="preloader">Preloader Bypass (.bin)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 font-mono mb-1">URL de Archivo Técnico*</label>
                            <input 
                              type="url" 
                              required 
                              placeholder="https://servidor-seguro.com/archivos/..." 
                              value={recursoUrl}
                              onChange={(e) => setRecursoUrl(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-500 font-mono mb-1">Notas Técnicas e Instrucciones Especiales</label>
                          <textarea 
                            placeholder="Describa el comportamiento de hardware o cómo forzar el bypass (Ej: 'Conectar GND en pin secundario...')" 
                            value={recursoNotas}
                            onChange={(e) => setRecursoNotas(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 h-16 resize-none"
                          />
                        </div>
                        <div className="flex justify-end gap-2 text-xs pt-1">
                          <button 
                            type="button" 
                            onClick={() => setShowRecursoForm(false)}
                            className="px-3 py-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="submit" 
                            className="px-3 py-1 bg-cyan-400 text-black font-semibold rounded hover:bg-cyan-500 font-mono cursor-pointer"
                          >
                            INSERT INTO recursos_tecnicos
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="overflow-x-auto border border-zinc-800 rounded-lg">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-zinc-950 border-b border-zinc-800 font-mono text-zinc-400">
                            <th className="p-3">ID</th>
                            <th className="p-3">Dispositivo ID</th>
                            <th className="p-3">Equipo Destino</th>
                            <th className="p-3">Tipo Recurso</th>
                            <th className="p-3">URL Archivo</th>
                            <th className="p-3">Instrucciones / Notas Técnicas</th>
                            <th className="p-3 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-850">
                          {recursosTecnicos.map((r) => {
                            const disp = dispositivos.find(d => d.id === r.dispositivo_id);
                            return (
                              <tr key={r.id} className="hover:bg-zinc-900/30">
                                <td className="p-3 font-mono text-zinc-400">{r.id}</td>
                                <td className="p-3 font-mono text-zinc-500">{r.dispositivo_id}</td>
                                <td className="p-3 font-semibold text-zinc-200">
                                  {disp ? `${disp.marca} ${disp.modelo}` : <span className="text-red-400 font-mono">Incompleto</span>}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono leading-none ${r.tipo_recurso === 'firehose' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/10' : r.tipo_recurso === 'test_point' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/10' : 'bg-blue-500/20 text-blue-300 border border-blue-500/10'}`}>
                                    {r.tipo_recurso.toUpperCase()}
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-zinc-400 break-all max-w-[200px]" title={r.url_archivo}>{r.url_archivo}</td>
                                <td className="p-3 text-zinc-300 max-w-[250px] truncate" title={r.notas_tecnicas}>{r.notas_tecnicas}</td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => handleDeleteRecurso(r.id)}
                                    className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* VISTA 3: SCRIPT DE PYTHON Y VARIABLES DE ENTORNO EN LINUX */}
            {activeTab === 'python' && (
              <motion.div 
                key="python-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                {/* NOTAS TÉCNICAS E INTEGRACIÓN SEGURA */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  
                  {/* SEGURIDAD DE ACCESOS Y SRE */}
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2 font-mono uppercase tracking-wider text-amber-400">
                      <Key className="h-4 w-4" />
                      Manejo Seguro de Credenciales
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Como experto en bases de datos y seguridad, **nunca expongas tus llaves API de Supabase en el código fuente de Python**. Si subes el script a un repositorio público (GitHub, GitLab), cualquiera tendrá acceso de lectura y escritura a tu base de datos.
                    </p>

                    <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 space-y-3">
                      <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase block">1. Archivo `.env` local</span>
                      <p className="text-[11px] text-zinc-400">
                        Crea un archivo llamado <code className="text-white font-mono bg-zinc-900 px-1 rounded">.env</code> en la misma carpeta donde reside tu script de Python:
                      </p>
                      <pre className="text-[10px] text-zinc-300 font-mono bg-zinc-900 p-2 rounded leading-normal border border-zinc-850 select-text overflow-x-auto">
                        {`SUPABASE_URL="${localEnv.SUPABASE_URL}"\nSUPABASE_KEY="${localEnv.SUPABASE_KEY.substring(0,25)}..."`}
                      </pre>
                      
                      <span className="text-[10px] font-bold font-mono text-rose-400 uppercase block">2. Declarar en `.gitignore`</span>
                      <p className="text-[11px] text-zinc-400">
                        Agrega el archivo `.env` a tu `.gitignore` para bloquear su subida a la nube:
                      </p>
                      <pre className="text-[10px] text-zinc-300 font-mono bg-zinc-900 p-1.5 rounded border border-zinc-850">
                        .env
                      </pre>
                    </div>

                    <div className="p-3 bg-zinc-950 rounded-lg border border-emerald-500/10 space-y-2">
                      <span className="text-[10px] font-bold font-mono text-emerald-300 uppercase block">3. Opcional - Variables del Shell Linux</span>
                      <p className="text-[11px] text-zinc-400">
                        Útil para servidores de taller o computadoras dedicadas. Exporta las variables directamente en tu sesión de terminal Linux o en <code className="text-white font-mono bg-zinc-900 px-1 rounded">~/.bashrc</code>:
                      </p>
                      <pre className="text-[10px] text-zinc-300 font-mono bg-zinc-900 p-2 rounded overflow-x-auto scrollbar-thin leading-normal select-text">
                        {`export SUPABASE_URL="${localEnv.SUPABASE_URL}"\nexport SUPABASE_KEY="tu_clave_supabase_completa"`}
                      </pre>
                      <p className="text-[10px] text-zinc-500">
                        Luego, en Python, puedes acceder a ellas de forma nativa utilizando <code className="text-white font-mono">os.getenv("VARIABLE")</code> sin necesidad de dependencias.
                      </p>
                    </div>
                  </div>

                  {/* REGLAS UDEV */}
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2 font-mono uppercase tracking-wider text-cyan-400">
                      <Settings className="h-4 w-4" />
                      Reglas UDEV para Linux
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      De forma predeterminada, los puertos USB bajo Linux solo pueden ser reclamados directamente por el súper usuario (<code className="text-white font-mono">root</code>). Para correr el script sin requerir <code className="text-white font-mono">sudo</code>, configura el gestor de dispositivos udev:
                    </p>
                    <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 space-y-2 font-mono text-[11px]">
                      <span className="text-[10px] text-zinc-500 uppercase block">1. Crear archivo de reglas:</span>
                      <code className="text-zinc-200 block bg-zinc-900 p-2 rounded text-[10px] select-text">
                        sudo nano /etc/udev/rules.d/99-qualcomm.rules
                      </code>
                      <span className="text-[10px] text-zinc-500 uppercase block">2. Pegar esta línea de permiso:</span>
                      <code className="text-emerald-400 block bg-zinc-900 p-2 rounded text-[10px] select-text break-all">
                        {"SUBSYSTEM==\"usb\", ATTR{idVendor}==\"05c6\", ATTR{idProduct}==\"9008\", MODE=\"0666\", GROUP=\"plugdev\""}
                      </code>
                      <span className="text-[10px] text-zinc-500 uppercase block">3. Recargar reglas del sistema:</span>
                      <code className="text-zinc-200 block bg-zinc-900 p-2 rounded text-[10px] select-text">
                        sudo udevadm control --reload-rules && sudo udevadm trigger
                      </code>
                    </div>
                  </div>
                </div>

                {/* VISUALIZADOR DE CÓDIGO PYTHON */}
                <div className="lg:col-span-8 flex flex-col">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl flex-1 flex flex-col">
                    
                    {/* Cabecera Archivo */}
                    <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 font-mono">
                        <FileCode className="h-4 w-4 text-emerald-400" />
                        <span className="text-white font-bold">{pythonScriptName}</span>
                        <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded">Python 3 (Executable)</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(pythonScriptContent, 'py')}
                          className="py-1 px-2.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded flex items-center gap-1 font-mono transition-all text-[11px] cursor-pointer"
                        >
                          {copiedState['py'] ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-emerald-400">¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copiar Código</span>
                            </>
                          )}
                        </button>

                        <a
                          href={`data:text/plain;charset=utf-8,${encodeURIComponent(pythonScriptContent)}`}
                          download={pythonScriptName}
                          className="py-1 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded flex items-center gap-1 font-mono transition-all text-[11px] cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Descargar Script</span>
                        </a>
                      </div>
                    </div>

                    {/* Editor de código */}
                    <div className="bg-zinc-950 p-4 overflow-auto font-mono text-[12px] leading-relaxed select-text text-zinc-300 max-h-[600px] scrollbar-thin scrollbar-thumb-zinc-800">
                      <pre className="whitespace-pre-wrap">{pythonScriptContent}</pre>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* VISTA 4: GUÍA VIRTUAL DE TEST POINTS (INTERACTIVO) */}
            {activeTab === 'testpoints' && (
              <motion.div 
                key="testpoints-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                {/* SELECTOR E INSTRUCCIONES */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2 font-mono uppercase tracking-wider text-emerald-400">
                      <BookMarked className="h-4 w-4" />
                      Especificador de Pinouts
                    </h3>
                    <p className="text-xs text-zinc-400 mb-4">
                      Para forzar a la controladora de hardware Qualcomm a entrar en modo EDL (05c6:9008) cuando el equipo está "brickead" o no responde a comandos ADB, se utiliza un **Test Point** (unir físicamente dos contactos metálicos con una pinza conductora mientras se conecta el cable USB).
                    </p>

                    <label className="block text-xs text-zinc-400 mb-1.5 font-mono">Seleccione un equipo del catálogo:</label>
                    <div className="space-y-2 mb-4">
                      {dispositivos.map((d) => (
                        <div 
                          key={d.id} 
                          onClick={() => setTestpointDeviceSelected(d.id)}
                          className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${testpointDeviceSelected === d.id ? 'bg-amber-500/10 border-amber-500 text-white' : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-750'}`}
                        >
                          <span className="font-semibold text-sm block">{d.marca} {d.modelo}</span>
                          <span className="text-[11px] text-zinc-500 font-mono block mt-1">CPU: {d.procesador} | EDL Compatible</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <span className="text-[10px] font-mono font-bold text-amber-400 uppercase block mb-1">Notas Técnicas Oficiales de Servicio:</span>
                      <p className="text-xs text-zinc-300 leading-relaxed font-mono">
                        {recursosTecnicos.find(r => r.dispositivo_id === testpointDeviceSelected && r.tipo_recurso === 'test_point')?.notas_tecnicas || 
                         "Instrucción general: Remueva la tapa trasera y el blindaje metálico. Localice los dos pads ubicados cerca del flex de la batería e interconéctelos con pinzas de punta fina antes de insertar el cable USB."}
                      </p>
                    </div>
                  </div>

                  {/* PROCEDIMIENTO PASO A PASO */}
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-3">
                    <h4 className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase">Procedimiento de Conexión de Hardware:</h4>
                    <ol className="text-xs text-zinc-400 space-y-2 list-decimal list-inside font-mono">
                      <li>Apagar por completo el teléfono móvil.</li>
                      <li>Desconectar el conector flex físico de la batería de la placa madre.</li>
                      <li>Utilizar pinzas antiestáticas de precisión para puentear los dos puntos marcados en amarillo en el gráfico interactivo derecha.</li>
                      <li>Manteniendo el puente, conectar el cable USB conectado al puerto PC Linux.</li>
                      <li>El sistema Linux lo reconocerá de inmediato como <code className="text-white">05c6:9008</code>, momento en el cual puede retirar las pinzas y lanzar la inyección de Firehose desde el script de Python.</li>
                    </ol>
                  </div>
                </div>

                {/* DIAGRAMA PCB VIRTUAL INTERACTIVO CON SVG */}
                <div className="lg:col-span-7 flex flex-col">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl flex-1 flex flex-col">
                    <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex justify-between items-center text-xs">
                      <span className="font-mono text-zinc-300">
                        Esquema Interactivos de Placa Madre (PCB): <strong className="text-white">
                          {dispositivos.find(d => d.id === testpointDeviceSelected)?.marca} {dispositivos.find(d => d.id === testpointDeviceSelected)?.modelo}
                        </strong>
                      </span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold select-none">
                        ZONA TEST POINT (TP)
                      </span>
                    </div>

                    <div className="bg-zinc-950 flex-1 p-6 flex flex-col items-center justify-center min-h-[350px]">
                      
                      {/* DIAGRAMA MATRICES PCB CON SVG */}
                      <div className="relative w-full max-w-[340px] aspect-[4/5] bg-emerald-950/20 border-2 border-emerald-500/20 rounded-xl p-4 flex flex-col justify-between shadow-inner shadow-emerald-950">
                        {/* Pistas de cobre ornamentales del fondo del circuito */}
                        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-15"></div>
                        <div className="absolute top-20 left-10 w-24 h-[2px] bg-emerald-600/30 rotate-45"></div>
                        <div className="absolute bottom-20 right-10 w-32 h-[2px] bg-emerald-600/30 -rotate-12"></div>
                        
                        {/* Procesador Snapdragon ficticio */}
                        <div className="relative z-10 mx-auto w-36 h-36 bg-zinc-900 border-2 border-zinc-700 rounded flex flex-col items-center justify-center shadow-lg shadow-black/80">
                          <Cpu className="h-10 w-10 text-zinc-400 mb-1" />
                          <span className="text-[10px] font-bold text-white font-mono tracking-wider">Snapdragon A15</span>
                          <span className="text-[8px] text-zinc-500 font-mono">QUALCOMM INC.</span>
                        </div>

                        {/* Pads de Test Point Destacados */}
                        <div className="relative z-10 w-full flex justify-around items-center p-3">
                          {/* Flex Conector Batería */}
                          <div className="w-14 h-6 bg-zinc-800 border border-zinc-650 rounded flex items-center justify-center text-[7px] text-zinc-500 font-mono">
                            FLEX BATT
                          </div>

                          {/* Los dos puntos amarillos para cortocircuito */}
                          <div className="flex flex-col items-center p-2 bg-zinc-900/90 border border-zinc-700 rounded-lg">
                            <span className="text-[9px] text-zinc-400 font-mono mb-1.5">TEST POINTS</span>
                            <div className="flex gap-4 relative">
                              
                              {/* Línea de simulación de puente */}
                              <div className="absolute inset-x-2 top-2 h-0.5 bg-yellow-400 animate-pulse"></div>
                              
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="h-5 w-5 rounded-full bg-yellow-400 hover:bg-yellow-300 border-2 border-zinc-950 cursor-pointer animate-ping absolute opacity-30"></span>
                                <span className="h-5 w-5 rounded-full bg-yellow-500 hover:bg-yellow-300 border-2 border-zinc-950 cursor-pointer flex items-center justify-center text-[8px] text-black font-extrabold relative z-10" title="Touch GND">G</span>
                                <span className="text-[7px] font-mono text-zinc-400">GND</span>
                              </div>

                              <div className="flex flex-col items-center gap-0.5">
                                <span className="h-5 w-5 rounded-full bg-yellow-400 hover:bg-yellow-300 border-2 border-zinc-950 cursor-pointer animate-ping absolute opacity-30"></span>
                                <span className="h-5 w-5 rounded-full bg-yellow-500 hover:bg-yellow-300 border-2 border-zinc-950 cursor-pointer flex items-center justify-center text-[8px] text-black font-extrabold relative z-10" title="Touch DATA / CLK">D</span>
                                <span className="text-[7px] font-mono text-zinc-400">DATA</span>
                              </div>

                            </div>
                          </div>
                        </div>

                        {/* Terminales de Circuito sutiles creados en CSS */}
                        <div className="flex justify-between items-center text-[8px] font-mono text-zinc-500 border-t border-zinc-800/40 pt-2 z-10">
                          <span>GUACHARACA BOARD SERVICE</span>
                          <span>{dispositivos.find(d => d.id === testpointDeviceSelected)?.marca || "QCOM"} v3</span>
                        </div>
                      </div>

                      <div className="mt-4 text-center max-w-sm">
                        <p className="text-xs text-zinc-400 italic">
                          Pasa las pinzas unificadoras por los puertos <strong className="text-yellow-400">GND (Tierra)</strong> y <strong className="text-yellow-400">DATA</strong>. Al sostenerlos y presionar el botón de monitoreo, el bus activará el protocolo EDL en Linux instantáneamente.
                        </p>
                      </div>

                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* VISTA 5: LOGS DE AUDITORÍA LEGAL (VINCULACIÓN DE IMEI) */}
            {activeTab === 'auditoria' && (
              <motion.div 
                key="auditoria-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                
                {/* EXPLICACIÓN LEGAL */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row gap-5 items-start">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                    <ShieldAlert className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">Garantía de Ley y Responsabilidad Profesional</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      De conformidad con las leyes nacionales en materia de delitos informáticos y telecomunicaciones (ej. Ley contra Delitos Informáticos en Venezuela), la alteración de IMEI o liberación sin auditoría de soporte puede derivar en contingencias legales graves. Este módulo asocia cada intervención en la "Guacharaca Suite" con un documento de identidad nacional, un IMEI de hardware certificado y el motivo técnico por el cual se realiza el puente EDL.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* FORMULARIO DE REGISTRO */}
                  <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2 font-mono uppercase tracking-wider text-emerald-400">
                      <FileCheck className="h-4 w-4" />
                      Registrar Orden & Vínculo Legal
                    </h3>

                    <form onSubmit={handleAddAuditLog} className="space-y-3.5">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1.5 font-mono">Dispositivo Intervenido:</label>
                        <select 
                          value={auditDispositivo}
                          onChange={(e) => setAuditDispositivo(Number(e.target.value))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                        >
                          {dispositivos.map(d => (
                            <option key={d.id} value={d.id}>{d.marca} {d.modelo} ({d.procesador})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1.5 font-mono">Número de IMEI del Terminal (15 dígitos):</label>
                        <input 
                          type="text" 
                          required 
                          pattern="[0-9]{15}"
                          maxLength={15}
                          placeholder="Ej: 863489052281923"
                          value={auditImei}
                          onChange={(e) => setAuditImei(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white uppercase font-mono focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/35"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1.5 font-mono">Nombre Completo del Propietario (Cliente):</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Ej: Juan Vicente Gómez"
                          value={auditCliente}
                          onChange={(e) => setAuditCliente(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1.5 font-mono">Documento de Identidad Nacional (Cédula de Identidad/Pasaporte):</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Ej: V-25.102.834"
                          value={auditDoc}
                          onChange={(e) => setAuditDoc(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white uppercase font-mono focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1.5 font-mono">Motivo del Servicio o Diagnóstico Técnico:</label>
                        <textarea 
                          placeholder="Describa el problema. Ejemplo: Recuperación de álbum fotográfico familiar tras falla sistémica del sistema operativo..."
                          value={auditMotivo}
                          onChange={(e) => setAuditMotivo(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 h-20 resize-none"
                        />
                      </div>

                      {auditSuccessMsg && (
                        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded text-xs font-mono flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>¡Vínculo legal auditado y firmado con éxito!</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold font-mono py-2 px-4 rounded-lg text-xs transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                      >
                        Firmar y Almacenar en Supabase
                      </button>
                    </form>
                  </div>

                  {/* LOGS HISTÓRICOS DE TRANSACCIONES */}
                  <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2 font-mono uppercase tracking-wider text-cyan-400">
                      <Terminal className="h-4 w-4" />
                      Registro Histórico de Auditoría Inalterable (Logs)
                    </h3>

                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[480px] scrollbar-thin scrollbar-thumb-zinc-800">
                      {logsAuditoria.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500 text-xs">
                          No hay logs de auditoría legal registrados.
                        </div>
                      ) : (
                        logsAuditoria.map((log) => {
                          const disp = dispositivos.find(d => d.id === log.dispositivo_id);
                          return (
                            <div key={log.id} className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 text-xs leading-normal space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-semibold text-white text-sm block">Propietario: {log.cliente_nombre}</span>
                                  <span className="text-[10px] text-zinc-500 font-mono">D.I. Nacional: <strong className="text-zinc-300">{log.cliente_documento}</strong></span>
                                </div>
                                <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-mono">
                                  FIRMA OK
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 p-2 bg-zinc-900/50 rounded font-mono text-[11px] text-zinc-400">
                                <div>
                                  <span className="text-[10px] text-zinc-500 block">DISPOSITIVO</span>
                                  <span className="text-white font-medium">{disp ? `${disp.marca} ${disp.modelo}` : "Identidad Eliminada"}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-zinc-500 block">IMEl CERTIFICADO</span>
                                  <span className="text-white font-medium">{log.imei}</span>
                                </div>
                              </div>

                              <div>
                                <span className="text-[10px] text-zinc-500 font-mono block">JUSTIFICACIÓN TÉCNICA DEL INGENIERO:</span>
                                <p className="text-zinc-300 italic">"{log.motivo_servicio}"</p>
                              </div>

                              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono border-t border-zinc-800/40 pt-2">
                                <span>Ref: {log.id}</span>
                                <span>Timestamp: {new Date(log.timestamp).toLocaleString()}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* VISTA 6: queries SQL exactas y estructuradas */}
            {activeTab === 'sql' && (
              <motion.div 
                key="sql-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Key className="h-5 w-5 text-emerald-400" />
                        Esquema SQL de Supabase (PostgreSQL)
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">
                        Copia y pega estas directrices directamente en el editor SQL de Supabase para generar la estructura, dependencias foreign-key e insertar el registro del Xiaomi Redmi Note 12.
                      </p>
                    </div>

                    <button
                      onClick={() => handleCopy(initialSqlSchema, 'sql')}
                      className="py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-205 rounded flex items-center gap-1 font-mono text-xs cursor-pointer"
                    >
                      {copiedState['sql'] ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-400" />
                          <span className="text-emerald-400">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copiar Todo el Script SQL</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 font-mono text-[12px] leading-relaxed text-zinc-350 select-text overflow-x-auto max-h-[500px] scrollbar-thin scrollbar-thumb-zinc-800">
                    <pre>{initialSqlSchema}</pre>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-zinc-900/40 p-5 rounded-xl border border-zinc-800 text-xs leading-relaxed space-y-2">
                    <span className="text-emerald-400 font-bold font-mono uppercase text-[11px] block">CORS e Inclusiones</span>
                    <p className="text-zinc-400">
                      Supabase proporciona de forma integrada un wrapper HTTP llamado **PostgREST** sobre tu base de datos PostgreSQL. Este mapea de forma inmediata tablas a JSON, permitiendo consultas asíncronas con filtros condicionales transparentes desde tu script de Python local sin necesidad de montar routers dedicados en NodeJS.
                    </p>
                  </div>
                  <div className="bg-zinc-900/40 p-5 rounded-xl border border-zinc-800 text-xs leading-relaxed space-y-2">
                    <span className="text-cyan-400 font-bold font-mono uppercase text-[11px] block">Integridad Referencial</span>
                    <p className="text-zinc-400">
                      La tabla <code className="text-white">recursos_tecnicos</code> cuenta con un enlace referencial <code className="text-emerald-400">ON DELETE CASCADE</code> conectado a la tabla madre <code className="text-white">dispositivos</code>. Al purgar un teléfono móvil, todos sus cargadores y esquemas udev se depurarán automáticamente de forma transaccional.
                    </p>
                  </div>
                  <div className="bg-zinc-900/40 p-5 rounded-xl border border-zinc-800 text-xs leading-relaxed space-y-2">
                    <span className="text-amber-400 font-bold font-mono uppercase text-[11px] block">Acceso Restricto</span>
                    <p className="text-zinc-400">
                      Se recomienda habilitar políticas **RLS (Row Level Security)** en Supabase en entornos de producción. Esto evitará consultas maliciosas externas limitando el acceso de lectura sólo a llamadas que porten tokens JWT confiables del taller.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 bg-zinc-950 text-xs text-zinc-500 py-8 px-4 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-zinc-400">Guacharaca Service Suite v1.0.0</span>
            <span className="text-zinc-700">|</span>
            <span>Herramienta GPLv3 Open-Source para Linux de Recuperación y Bypass EDL</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px] text-zinc-400">
            <span>Powered by Antigravity OS</span>
            <span>Venezuela & Latam Devs</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
