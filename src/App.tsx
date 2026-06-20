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
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* HEADER PRINCIPAL - ESTILO BENTO GLASS */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/5 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Cpu className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-wider text-white font-display uppercase">GUACHARACA</h1>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md font-mono border border-emerald-500/20 uppercase tracking-widest">
                  Service Suite
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans tracking-tight">Entorno de Prototipado, Monitoreo EDL 9008 y Gestión de Recursos para Linux</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs bg-zinc-900/60 p-1 rounded-lg border border-zinc-800/80 font-mono">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#09090b] text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Daemon: <strong className="text-emerald-400 font-medium">Activo</strong></span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#09090b] text-zinc-300">
              <span>Portapapeles:</span>
              <span className="text-emerald-400 font-bold">Listos</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#09090b] text-emerald-450">
              <HardDrive className="h-3.5 w-3.5 text-emerald-500" />
              <span>/tmp/</span>
              <span className="text-white">({downloadedFiles.length} cargados)</span>
            </div>
          </div>
        </div>
      </header>

      {/* REGULACIÓN Y RESPONSABILIDAD ANTE LA LEY - STATUS CAPSULE */}
      <div className="bg-gradient-to-r from-emerald-950/20 via-[#0d1410] to-[#0a0f12] border-b border-zinc-805 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2 text-[11px]">
          <div className="flex items-center gap-2 text-emerald-400/90">
            <ShieldAlert className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>
              <strong className="text-emerald-300 font-mono text-[10px] uppercase tracking-wider">Visión y Ética Profesional:</strong> Respaldamos la independencia técnica eliminando la dependencia de cajas comerciales caras. Registro de auditoría integrado para transparencia legal.
            </span>
          </div>
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-widest select-none">
            Linux Native Protocol
          </span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        
        {/* NAVEGACIÓN DE VISTAS - BENTO SEGMENTED CONTROLS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 bg-[#121214] p-1.5 rounded-2xl border border-zinc-800/80 mb-8">
          <button 
            onClick={() => setActiveTab('detector')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs transition-all font-mono tracking-tight cursor-pointer ${activeTab === 'detector' ? 'bg-[#18181b] border border-zinc-700/60 text-emerald-400 shadow-md font-semibold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'}`}
          >
            <Terminal className="h-4 w-4 text-emerald-400" />
            <span>1. CONSOLA EDL</span>
          </button>
          <button 
            onClick={() => setActiveTab('database')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs transition-all font-mono tracking-tight cursor-pointer ${activeTab === 'database' ? 'bg-[#18181b] border border-zinc-700/60 text-emerald-400 shadow-md font-semibold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'}`}
          >
            <Database className="h-4 w-4 text-emerald-400" />
            <span>2. SUPABASE DB</span>
          </button>
          <button 
            onClick={() => setActiveTab('python')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs transition-all font-mono tracking-tight cursor-pointer ${activeTab === 'python' ? 'bg-[#18181b] border border-zinc-700/60 text-emerald-400 shadow-md font-semibold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'}`}
          >
            <FileCode className="h-4 w-4 text-emerald-400" />
            <span>3. PYTHON LOCAL</span>
          </button>
          <button 
            onClick={() => setActiveTab('testpoints')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs transition-all font-mono tracking-tight cursor-pointer ${activeTab === 'testpoints' ? 'bg-[#18181b] border border-zinc-700/60 text-emerald-400 shadow-md font-semibold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'}`}
          >
            <BookMarked className="h-4 w-4 text-emerald-400" />
            <span>4. TEST POINTS</span>
          </button>
          <button 
            onClick={() => setActiveTab('auditoria')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs transition-all font-mono tracking-tight cursor-pointer ${activeTab === 'auditoria' ? 'bg-[#18181b] border border-zinc-700/60 text-emerald-400 shadow-md font-semibold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'}`}
          >
            <FileCheck className="h-4 w-4 text-emerald-400" />
            <span>5. AUDITORÍA</span>
          </button>
          <button 
            onClick={() => setActiveTab('sql')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs transition-all font-mono tracking-tight cursor-pointer ${activeTab === 'sql' ? 'bg-[#18181b] border border-zinc-700/60 text-emerald-400 shadow-md font-semibold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'}`}
          >
            <Key className="h-4 w-4 text-emerald-400" />
            <span>6. ESQUEMA SQL</span>
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
                className="grid grid-cols-1 lg:grid-cols-12 gap-5"
              >
                
                {/* PANEL DE CONTROL DE SELECCIÓN - BENTO SLOT 1 */}
                <div className="lg:col-span-4 flex flex-col gap-5">
                  <div className="bg-[#0c0c0e] border border-zinc-805 rounded-2xl p-5 shadow-xl transition-all hover:border-zinc-800">
                    <h3 className="text-xs font-semibold text-white mb-3.5 flex items-center gap-2 font-display uppercase tracking-widest text-emerald-400">
                      <Settings className="h-4 w-4" />
                      Inicializador de Dispositivo
                    </h3>
                    <p className="text-xs text-zinc-400 mb-4 font-sans leading-relaxed">
                      Simula la conexión de un dispositivo físico de los registrados en el servidor para lanzar la consulta a Supabase y descargar su cargador.
                    </p>

                    <label className="block text-[10px] text-zinc-500 mb-2 font-mono uppercase tracking-wider">Seleccionar Dispositivo Objetivo:</label>
                    <div className="space-y-2 mb-4">
                      {dispositivos.map((d) => (
                        <div 
                          key={d.id} 
                          onClick={() => !isSimulating && setCurrentDeviceSelected(d.id)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${currentDeviceSelected === d.id ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-lg' : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900/10'}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-sm block font-sans">{d.marca} {d.modelo}</span>
                            <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono px-2 py-0.5 rounded-md">
                              {d.procesador}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono block mt-1">VID:PID: {d.chipset_id}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => startSimulation('pyusb')}
                        disabled={isSimulating}
                        className={`w-full py-3 px-4 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${isSimulating ? 'bg-zinc-900 text-zinc-600 border border-zinc-850' : 'bg-emerald-500 hover:bg-emerald-600 text-black shadow-lg shadow-emerald-500/10'}`}
                      >
                        <Usb className="h-4 w-4" />
                        Simular EDL vía PyUSB (MÉTODO 1)
                      </button>

                      <button
                        onClick={() => startSimulation('sys')}
                        disabled={isSimulating}
                        className={`w-full py-2.5 px-4 rounded-xl font-mono text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900 text-zinc-300 hover:border-zinc-700`}
                      >
                        <Layers className="h-3.5 w-3.5 text-zinc-400" />
                        Simular Fallback /sys/ (MÉTODO 2)
                      </button>
                    </div>
                  </div>

                  {/* DIRECTORIO TEMPORAL - BENTO SLOT 2 */}
                  <div className="bg-[#0c0c0e] border border-zinc-805 rounded-2xl p-5 shadow-xl transition-all hover:border-zinc-800">
                    <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2 font-display uppercase tracking-widest text-emerald-400">
                      <HardDrive className="h-4 w-4" />
                      Directorio Temporal (/tmp)
                    </h3>
                    <p className="text-xs text-zinc-400 mb-4 font-sans leading-relaxed">
                      Archivos descargados en el sistema de archivos temporal listos para inyección en Linux mediante Sahara/Firehose.
                    </p>

                    {downloadedFiles.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs font-mono">
                        No hay archivos descargados todavía.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {downloadedFiles.map((file, idx) => (
                          <div key={idx} className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-850 text-xs font-mono flex justify-between items-center">
                            <div>
                              <span className="text-emerald-400 block break-all font-semibold">{file.name}</span>
                              <span className="text-[10px] text-zinc-500 block mt-0.5">Tamaño: {file.size} | Guardado: {file.timestamp}</span>
                            </div>
                            <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold select-none">
                              LISTO
                            </span>
                          </div>
                        ))}
                        <button
                          onClick={() => setDownloadedFiles([])}
                          className="w-full text-center text-[10px] text-zinc-500 hover:text-rose-400 cursor-pointer pt-3 font-mono flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                          Limpiar directorio temporal
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* CONSOLA DE TERMINAL LINUX - BENTO SLOT 3 */}
                <div className="lg:col-span-8 flex flex-col gap-5">
                  <div className="bg-[#0c0c0e] border border-zinc-855 rounded-2xl overflow-hidden flex-1 flex flex-col shadow-2xl transition-all hover:border-zinc-800">
                    
                    {/* Cabecera Terminal */}
                    <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-855 flex justify-between items-center text-[11px]">
                      <div className="flex items-center gap-2 font-mono">
                        <Terminal className="h-4 w-4 text-emerald-400 animate-pulse" />
                        <span className="text-[#a1a1aa] font-medium">guacharaca@linux-workbench: ~</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                        <span>05c6:9008 EDL Monitor daemon</span>
                      </div>
                    </div>

                    {/* Cuerpo logs terminal */}
                    <div className="p-4 bg-zinc-950/80 font-mono text-[11px] leading-relaxed overflow-y-auto space-y-1.5 min-h-[420px] max-h-[500px] scrollbar-thin scrollbar-thumb-zinc-800">
                      {terminalLogs.map((log, index) => {
                        let color = "text-zinc-300";
                        if (log.startsWith("[+]")) color = "text-emerald-400 font-semibold";
                        if (log.startsWith("[-]")) color = "text-rose-400";
                        if (log.startsWith("[*]")) color = "text-cyan-400 font-semibold";
                        if (log.startsWith("[!]") || log.includes("ADVERTENCIA")) color = "text-sky-300";
                        if (log.startsWith(" GUACHARACA") || log.startsWith(" GUACHARACA SERVICE")) color = "text-emerald-300 font-bold bg-emerald-950/30 px-1 py-0.5 rounded";
                        if (log.startsWith("==========") || log.startsWith("----------")) color = "text-zinc-650";
                        if (log.startsWith("    -") || log.startsWith("    UP") || log.startsWith("    EP")) color = "text-zinc-400";
                        
                        return (
                           <div key={index} className={`whitespace-pre-wrap tracking-wide ${color}`}>
                             {log}
                           </div>
                        );
                      })}
                      {isSimulating && (
                        <div className="flex items-center gap-2 text-zinc-500 animate-pulse mt-3 font-mono">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                          <span>Procesando petición en tiempo real...</span>
                        </div>
                      )}
                      <div ref={terminalEndRef}></div>
                    </div>

                    {/* Barra de estado con progreso simulado */}
                    {simulatedProgress !== null && (
                      <div className="bg-zinc-950 px-4 py-3.5 border-t border-zinc-855">
                        <div className="flex justify-between items-center text-[10px] text-[#71717a] mb-1.5 font-mono">
                          <span>Estado del Handshake & Consulta REST SQL:</span>
                          <span className="font-semibold text-emerald-400">{simulatedProgress}%</span>
                        </div>
                        <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                          <div 
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300 shadow-sm shadow-emerald-500/20"
                            style={{ width: `${simulatedProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Panel de Atajos e Instrucciones Rápidas - BENTO SLOT 4 */}
                  <div className="bg-[#0c0c0e] border border-zinc-805 rounded-2xl p-5 flex gap-4 text-xs text-zinc-400 transition-all hover:border-zinc-800">
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl h-fit shrink-0">
                      <Info className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-zinc-200 font-semibold mb-1 text-sm font-sans tracking-tight">¿Qué está sucediendo internamente bajo el capó?</p>
                      <p className="mb-3 leading-relaxed">
                        El script emulado monitorea activamente el bus USB mediante descriptores virtuales del sistema operativo Linux. En cuanto reconoce el chipset ID <span className="font-mono text-zinc-300 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-md">05c6:9008</span>, autentica mediante cabeceras CORS en Supabase, extrae el archivo programador <span className="text-emerald-400 font-mono font-medium">prog_firehose.elf</span> de la URL almacenada y lo descarga para alimentar al cargador de Linux de inmediato.
                      </p>
                      <button 
                        onClick={() => setActiveTab('python')}
                        className="text-emerald-400 font-mono text-[11px] hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
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
                <div className="bg-[#0c0c0e] border border-zinc-805 rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-emerald-400" />
                        <h2 className="text-lg font-bold text-white font-display tracking-tight">Visualizador de Base de Datos (Supabase)</h2>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        Sincronización bidireccional simulada para la consola. Los cambios añadidos o eliminados afectarán de inmediato la detección del dispositivo en la pestaña anterior.
                      </p>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                      <div className="bg-zinc-950/60 border border-zinc-850 rounded-xl flex items-center px-3 py-2 text-xs flex-1 md:w-64 transition-all focus-within:border-emerald-500/40">
                        <Search className="h-4 w-4 text-zinc-500 mr-2 shrink-0" />
                        <input 
                          type="text" 
                          placeholder="Buscar dispositivo o chip..."
                          value={dbSearch}
                          onChange={(e) => setDbSearch(e.target.value)}
                          className="bg-transparent border-none text-zinc-200 focus:outline-none w-full font-sans text-xs"
                        />
                      </div>

                      <button
                        onClick={() => {
                          setDispositivos(initialDispositivos);
                          setRecursosTecnicos(initialRecursosTecnicos);
                          setTerminalLogs(prev => [...prev, "[*] Base de datos restablecida a los valores SQL por defecto."]);
                        }}
                        className="py-1.5 px-3.5 border border-zinc-800 hover:border-zinc-650 bg-zinc-900/60 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer transition-all hover:bg-zinc-900 text-zinc-300"
                        title="Restaurar a datos de ejemplo de Xiaomi Redmi Note 12"
                      >
                        <RefreshCw className="h-3.5 w-3.5 text-zinc-405" />
                        <span>Restablecer</span>
                      </button>
                    </div>
                  </div>

                  {/* TABLA PRINCIPAL: DISPOSITIVOS */}
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-405 flex items-center gap-2 font-semibold">
                        <Layers className="h-3.5 w-3.5 text-emerald-400" />
                        Tabla: `dispositivos` ({filteredDispositivos.length} registrados)
                      </h3>
                      <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="py-1.5 px-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 hover:bg-emerald-500/20 rounded-lg text-xs flex items-center gap-1.5 font-mono cursor-pointer transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>SQL INSERT</span>
                      </button>
                    </div>

                    {/* FORMULARIO DISPOSITIVO */}
                    {showAddForm && (
                      <form onSubmit={handleAddDispositivo} className="bg-zinc-950/40 p-5 border border-zinc-850 rounded-xl space-y-4">
                        <h4 className="text-xs font-semibold text-emerald-400 font-mono tracking-wider uppercase">Nuevo Registro de Dispositivo</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-[10px] text-zinc-500 font-mono mb-1.5 uppercase tracking-wider">Marca*</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="Ej: Xiaomi" 
                              value={newBrand}
                              onChange={(e) => setNewBrand(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-855 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/40"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 font-mono mb-1.5 uppercase tracking-wider">Modelo*</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="Ej: Redmi Note 12 4G" 
                              value={newModel}
                              onChange={(e) => setNewModel(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-855 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/40"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 font-mono mb-1.5 uppercase tracking-wider">Procesador*</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="Ej: Snapdragon 685" 
                              value={newProcessor}
                              onChange={(e) => setNewProcessor(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-855 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/40"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 font-mono mb-1.5 uppercase tracking-wider">Chipset ID*</label>
                            <input 
                              type="text" 
                              required 
                              value={newChipset}
                              onChange={(e) => setNewChipset(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-855 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500/40"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 text-xs pt-1">
                          <button 
                            type="button" 
                            onClick={() => setShowAddForm(false)}
                            className="px-3.5 py-1.5 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="submit" 
                            className="px-4 py-1.5 bg-emerald-500 text-black font-semibold rounded-xl hover:bg-emerald-600 font-mono cursor-pointer shadow-lg shadow-emerald-500/10 transition-all text-xs"
                          >
                            INSERT INTO dispositivos
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="overflow-x-auto border border-zinc-850 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-zinc-950/80 border-b border-zinc-850 font-mono text-[#a1a1aa] tracking-tight">
                            <th className="p-3.5">ID</th>
                            <th className="p-3.5">Marca</th>
                            <th className="p-3.5">Modelo</th>
                            <th className="p-3.5">Procesador</th>
                            <th className="p-3.5 font-mono">Chipset ID</th>
                            <th className="p-3.5 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-855">
                          {filteredDispositivos.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-[#71717a] font-mono">
                                Ningún dispositivo coincide con la búsqueda.
                              </td>
                            </tr>
                          ) : (
                            filteredDispositivos.map((d) => (
                              <tr key={d.id} className="hover:bg-zinc-900/10 transition-colors">
                                <td className="p-3.5 font-mono text-zinc-500">{d.id}</td>
                                <td className="p-3.5 font-bold text-white font-sans">{d.marca}</td>
                                <td className="p-3.5 text-zinc-200 font-sans">{d.modelo}</td>
                                <td className="p-3.5 text-zinc-350">
                                  <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md text-[10px] font-mono">
                                    {d.procesador}
                                  </span>
                                </td>
                                <td className="p-3.5 font-mono text-emerald-400">{d.chipset_id}</td>
                                <td className="p-3.5 text-right">
                                  <button
                                    onClick={() => handleDeleteDispositivo(d.id)}
                                    className="p-1.5 text-zinc-500 hover:text-rose-400 cursor-pointer transition-colors hover:bg-zinc-900/40 rounded-lg"
                                    title="Eliminar dispositivo y sus recursos"
                                  >
                                    <Trash2 className="h-4 w-4" />
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
                      <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-405 flex items-center gap-2 font-semibold">
                        <Database className="h-3.5 w-3.5 text-cyan-400" />
                        Tabla: `recursos_tecnicos` ({recursosTecnicos.length} vinculados)
                      </h3>
                      <button
                        onClick={() => {
                          if (dispositivos.length > 0) {
                            setAssocDispositivoId(dispositivos[0].id);
                          }
                          setShowRecursoForm(!showRecursoForm);
                        }}
                        className="py-1.5 px-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 rounded-lg text-xs flex items-center gap-1.5 font-mono cursor-pointer transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Asociar Recurso</span>
                      </button>
                    </div>

                    {/* FORMULARIO RECURSO */}
                    {showRecursoForm && (
                      <form onSubmit={handleAddRecurso} className="bg-zinc-950/40 p-5 border border-zinc-850 rounded-xl space-y-4 animate-fadeIn">
                        <h4 className="text-xs font-semibold text-cyan-400 font-mono tracking-wider uppercase">Nuevo Recurso Técnico de Reparación</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] text-zinc-500 font-mono mb-1.5 uppercase tracking-wider">Dispositivo Asociado*</label>
                            <select 
                              value={assocDispositivoId}
                              onChange={(e) => setAssocDispositivoId(Number(e.target.value))}
                              className="w-full bg-zinc-950 border border-zinc-855 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                            >
                              {dispositivos.map(d => (
                                <option key={d.id} value={d.id}>{d.marca} {d.modelo}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 font-mono mb-1.5 uppercase tracking-wider">Tipo de Recurso*</label>
                            <select 
                              value={recursoTipo}
                              onChange={(e) => setRecursoTipo(e.target.value as any)}
                              className="w-full bg-zinc-950 border border-zinc-855 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                            >
                              <option value="firehose">Firehose Loader (.elf)</option>
                              <option value="test_point">Test Point Diagram (.jpg)</option>
                              <option value="preloader">Preloader Bypass (.bin)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 font-mono mb-1.5 uppercase tracking-wider">URL de Archivo Técnico*</label>
                            <input 
                              type="url" 
                              required 
                              placeholder="https://servidor-seguro.com/archivos/..." 
                              value={recursoUrl}
                              onChange={(e) => setRecursoUrl(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-855 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-500 font-mono mb-1.5 uppercase tracking-wider">Notas Técnicas e Instrucciones Especiales</label>
                          <textarea 
                            placeholder="Describa el comportamiento de hardware o cómo forzar el bypass (Ej: 'Conectar GND en pin secundario...')" 
                            value={recursoNotas}
                            onChange={(e) => setRecursoNotas(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-855 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/40 h-20 resize-none font-sans"
                          />
                        </div>
                        <div className="flex justify-end gap-3 text-xs pt-1">
                          <button 
                            type="button" 
                            onClick={() => setShowRecursoForm(false)}
                            className="px-3.5 py-1.5 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="submit" 
                            className="px-4 py-1.5 bg-cyan-400 text-black font-semibold rounded-xl hover:bg-cyan-500 font-mono cursor-pointer shadow-lg shadow-cyan-500/10 transition-all text-xs"
                          >
                            INSERT INTO recursos_tecnicos
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="overflow-x-auto border border-zinc-850 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-zinc-950/80 border-b border-zinc-850 font-mono text-[#a1a1aa] tracking-tight">
                            <th className="p-3.5">ID</th>
                            <th className="p-3.5">Dispositivo ID</th>
                            <th className="p-3.5">Equipo Destino</th>
                            <th className="p-3.5">Tipo Recurso</th>
                            <th className="p-3.5">URL Archivo</th>
                            <th className="p-3.5">Instrucciones / Notas Técnicas</th>
                            <th className="p-3.5 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-855">
                          {recursosTecnicos.map((r) => {
                            const disp = dispositivos.find(d => d.id === r.dispositivo_id);
                            return (
                              <tr key={r.id} className="hover:bg-zinc-900/10 transition-colors">
                                <td className="p-3.5 font-mono text-zinc-500">{r.id}</td>
                                <td className="p-3.5 font-mono text-zinc-500">{r.dispositivo_id}</td>
                                <td className="p-3.5 font-semibold text-zinc-200">
                                  {disp ? `${disp.marca} ${disp.modelo}` : <span className="text-red-400 font-mono">Incompleto</span>}
                                </td>
                                <td className="p-3.5">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider leading-none ${r.tipo_recurso === 'firehose' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : r.tipo_recurso === 'test_point' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'}`}>
                                    {r.tipo_recurso.toUpperCase()}
                                  </span>
                                </td>
                                <td className="p-3.5 font-mono text-zinc-400 break-all max-w-[200px]" title={r.url_archivo}>{r.url_archivo}</td>
                                <td className="p-3.5 text-zinc-350 max-w-[250px] truncate" title={r.notas_tecnicas}>{r.notas_tecnicas}</td>
                                <td className="p-3.5 text-right">
                                  <button
                                    onClick={() => handleDeleteRecurso(r.id)}
                                    className="p-1.5 text-zinc-500 hover:text-rose-450 cursor-pointer transition-colors hover:bg-zinc-900/40 rounded-lg"
                                  >
                                    <Trash2 className="h-4 w-4" />
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
                className="grid grid-cols-1 lg:grid-cols-12 gap-5"
              >
                {/* NOTAS TÉCNICAS E INTEGRACIÓN SEGURA */}
                <div className="lg:col-span-4 flex flex-col gap-5">
                  
                  {/* SEGURIDAD DE ACCESOS Y SRE */}
                  <div className="bg-[#0c0c0e] border border-zinc-805 rounded-2xl p-5 space-y-4 shadow-xl transition-all hover:border-zinc-800">
                    <h3 className="text-xs font-semibold text-white flex items-center gap-2 font-display uppercase tracking-widest text-[#fbbf24]">
                      <Key className="h-4 w-4" />
                      Manejo de Credenciales (.env)
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                      Como experto en bases de datos y seguridad, **nunca expongas tus llaves API de Supabase en el código fuente de Python**. Si subes el script a un repositorio público, cualquiera tendrá acceso de lectura y escritura a tu base de datos.
                    </p>

                    <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-850 space-y-3">
                      <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase block tracking-wider">1. Archivo `.env` local</span>
                      <p className="text-[11px] text-zinc-450 leading-relaxed">
                        Crea un archivo llamado <code className="text-white font-mono bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded">.env</code> en la misma carpeta donde reside tu script de Python:
                      </p>
                      <pre className="text-[10px] text-zinc-300 font-mono bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg leading-normal select-text overflow-x-auto">
                        {`SUPABASE_URL="${localEnv.SUPABASE_URL}"\nSUPABASE_KEY="${localEnv.SUPABASE_KEY.substring(0,25)}..."`}
                      </pre>
                      
                      <span className="text-[10px] font-bold font-mono text-rose-400 uppercase block tracking-wider">2. Declarar en `.gitignore`</span>
                      <p className="text-[11px] text-zinc-455 leading-relaxed">
                        Agrega el archivo `.env` a tu `.gitignore` para bloquear su subida a la nube:
                      </p>
                      <pre className="text-[10px] text-[#f43f5e] font-mono bg-zinc-900 border border-zinc-800 px-2 py-1.5 rounded-lg">
                        .env
                      </pre>
                    </div>

                    <div className="p-3 bg-zinc-950/60 rounded-xl border border-emerald-500/10 space-y-2">
                      <span className="text-[10px] font-bold font-mono text-emerald-300 uppercase block tracking-wider">3. Opcional - Variables del Shell Linux</span>
                      <p className="text-[11px] text-zinc-450 leading-relaxed">
                        Útil para servidores de taller o computadoras dedicadas. Exporta las variables directamente en tu sesión de terminal Linux o en <code className="text-white font-mono bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded">~/.bashrc</code>:
                      </p>
                      <pre className="text-[10px] text-zinc-300 font-mono bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg overflow-x-auto scrollbar-thin leading-normal select-text">
                        {`export SUPABASE_URL="${localEnv.SUPABASE_URL}"\nexport SUPABASE_KEY="tu_clave_supabase_completa"`}
                      </pre>
                      <p className="text-[10px] text-zinc-500 leading-normal font-sans">
                        Luego, en Python, puedes acceder a ellas de forma nativa utilizando <code className="text-white font-mono">os.getenv("VARIABLE")</code> sin necesidad de dependencias adicionales.
                      </p>
                    </div>
                  </div>

                  {/* REGLAS UDEV */}
                  <div className="bg-[#0c0c0e] border border-zinc-805 rounded-2xl p-5 space-y-3.5 shadow-xl transition-all hover:border-zinc-800">
                    <h3 className="text-xs font-semibold text-white flex items-center gap-2 font-display uppercase tracking-widest text-cyan-400">
                      <Settings className="h-4 w-4" />
                      Reglas UDEV para Linux
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                      De forma predeterminada, los puertos USB bajo Linux solo pueden ser reclamados directamente por el súper usuario (<code className="text-white font-mono">root</code>). Para correr el script sin requerir <code className="text-white font-mono">sudo</code>, configura el gestor de dispositivos udev:
                    </p>
                    <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-850 space-y-2.5 font-mono text-[11px]">
                      <span className="text-[10px] text-zinc-500 uppercase block tracking-wider">1. Crear archivo de reglas:</span>
                      <code className="text-zinc-200 block bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-[10px] select-text">
                        sudo nano /etc/udev/rules.d/99-qualcomm.rules
                      </code>
                      <span className="text-[10px] text-zinc-500 uppercase block tracking-wider">2. Pegar esta línea de permiso:</span>
                      <code className="text-emerald-400 block bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-[10px] select-text break-all">
                        {"SUBSYSTEM==\"usb\", ATTR{idVendor}==\"05c6\", ATTR{idProduct}==\"9008\", MODE=\"0666\", GROUP=\"plugdev\""}
                      </code>
                      <span className="text-[10px] text-zinc-500 uppercase block tracking-wider">3. Recargar reglas del sistema:</span>
                      <code className="text-zinc-200 block bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-[10px] select-text">
                        sudo udevadm control --reload-rules && sudo udevadm trigger
                      </code>
                    </div>
                  </div>
                </div>

                {/* VISUALIZADOR DE CÓDIGO PYTHON */}
                <div className="lg:col-span-8 flex flex-col">
                  <div className="bg-[#0c0c0e] border border-zinc-855 rounded-2xl overflow-hidden shadow-2xl flex-1 flex flex-col transition-all hover:border-zinc-800">
                    
                    {/* Cabecera Archivo */}
                    <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-855 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 font-mono">
                        <FileCode className="h-4 w-4 text-emerald-400" />
                        <span className="text-white font-bold">{pythonScriptName}</span>
                        <span className="text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md font-medium">Python 3 (Executable)</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(pythonScriptContent, 'py')}
                          className="py-1.5 px-3 bg-[#18181b] border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60 text-zinc-300 hover:text-white rounded-xl flex items-center gap-1.5 font-mono transition-all text-[11px] cursor-pointer"
                        >
                          {copiedState['py'] ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-emerald-400">¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-zinc-400" />
                              <span>Copiar Código</span>
                            </>
                          )}
                        </button>

                        <a
                          href={`data:text/plain;charset=utf-8,${encodeURIComponent(pythonScriptContent)}`}
                          download={pythonScriptName}
                          className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-xl flex items-center gap-1.5 font-mono transition-all text-[11px] cursor-pointer shadow-lg shadow-emerald-500/10"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Descargar Script</span>
                        </a>
                      </div>
                    </div>

                    {/* Editor de código */}
                    <div className="bg-zinc-950/80 p-4.5 overflow-auto font-mono text-[11.5px] leading-relaxed select-text text-zinc-300 max-h-[600px] scrollbar-thin scrollbar-thumb-zinc-800">
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
                className="grid grid-cols-1 lg:grid-cols-12 gap-5"
              >
                {/* SELECTOR E INSTRUCCIONES - BENTO SLOT 1 */}
                <div className="lg:col-span-5 flex flex-col gap-5">
                  <div className="bg-[#0c0c0e] border border-zinc-805 rounded-2xl p-5 shadow-xl transition-all hover:border-zinc-800">
                    <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2 font-display uppercase tracking-widest text-emerald-400">
                      <BookMarked className="h-4 w-4" />
                      Especificador de Pinouts
                    </h3>
                    <p className="text-xs text-zinc-400 mb-4 font-sans leading-relaxed">
                      Para forzar a la controladora de hardware Qualcomm a entrar en modo EDL (05c6:9008) cuando el equipo está "brickead" o no responde a comandos ADB, se utiliza un **Test Point** (unir físicamente dos contactos metálicos con una pinza conductora mientras se conecta el cable USB).
                    </p>

                    <label className="block text-[10px] text-zinc-500 mb-2 font-mono uppercase tracking-wider">Seleccione un equipo del catálogo:</label>
                    <div className="space-y-2 mb-4">
                      {dispositivos.map((d) => (
                        <div 
                          key={d.id} 
                          onClick={() => setTestpointDeviceSelected(d.id)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${testpointDeviceSelected === d.id ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-lg' : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900/10'}`}
                        >
                          <span className="font-semibold text-sm block font-sans">{d.marca} {d.modelo}</span>
                          <span className="text-[10px] text-zinc-500 font-mono block mt-1 uppercase">CPU: {d.procesador} | EDL Compatible</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-zinc-950/60 border border-zinc-850 rounded-xl">
                      <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block mb-1">Notas Oficiales de Servicio:</span>
                      <p className="text-xs text-zinc-300 leading-relaxed font-mono">
                        {recursosTecnicos.find(r => r.dispositivo_id === testpointDeviceSelected && r.tipo_recurso === 'test_point')?.notas_tecnicas || 
                         "Instrucción general: Remueva la tapa trasera y el blindaje metálico. Localice los dos pads ubicados cerca del flex de la batería e interconéctelos con pinzas de punta fina antes de insertar el cable USB."}
                      </p>
                    </div>
                  </div>

                  {/* PROCEDIMIENTO PASO A PASO - BENTO SLOT 2 */}
                  <div className="bg-[#0c0c0e] border border-zinc-805 rounded-2xl p-5 space-y-3.5 shadow-xl transition-all hover:border-zinc-800">
                    <h4 className="text-xs font-display font-bold tracking-widest text-[#a1a1aa] uppercase">Procedimiento de Conexión de Hardware:</h4>
                    <ol className="text-xs text-zinc-400 space-y-2.5 list-decimal list-inside font-mono leading-relaxed">
                      <li>Apagar por completo el teléfono móvil.</li>
                      <li>Desconectar el conector flex físico de la batería de la placa madre.</li>
                      <li>Utilizar pinzas antiestáticas de precisión para puentear los dos puntos marcados en amarillo en el gráfico interactivo derecha.</li>
                      <li>Manteniendo el puente, conectar el cable USB conectado al puerto PC Linux.</li>
                      <li>El sistema Linux lo reconocerá de inmediato como <code className="text-emerald-400 bg-zinc-900 border border-zinc-800 px-1 rounded">05c6:9008</code>, momento en el cual puede retirar las pinzas y lanzar la inyección de Firehose desde el script de Python.</li>
                    </ol>
                  </div>
                </div>

                {/* DIAGRAMA PCB VIRTUAL INTERACTIVO CON SVG - BENTO SLOT 3 */}
                <div className="lg:col-span-7 flex flex-col">
                  <div className="bg-[#0c0c0e] border border-zinc-855 rounded-2xl overflow-hidden shadow-2xl flex-1 flex flex-col transition-all hover:border-zinc-800">
                    <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-855 flex justify-between items-center text-xs">
                      <span className="font-mono text-zinc-300">
                        Esquema Interactivos de Placa Madre (PCB): <strong className="text-white">
                          {dispositivos.find(d => d.id === testpointDeviceSelected)?.marca} {dispositivos.find(d => d.id === testpointDeviceSelected)?.modelo}
                        </strong>
                      </span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-mono font-bold select-none">
                        ZONA TEST POINT (TP)
                      </span>
                    </div>

                    <div className="bg-zinc-950/55 flex-1 p-6 flex flex-col items-center justify-center min-h-[350px]">
                      
                      {/* DIAGRAMA MATRICES PCB CON SVG */}
                      <div className="relative w-full max-w-[340px] aspect-[4/5] bg-emerald-950/10 border-2 border-emerald-500/20 rounded-2xl p-4 flex flex-col justify-between shadow-inner shadow-emerald-950/40">
                        {/* Pistas de cobre ornamentales del fondo del circuito */}
                        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-15"></div>
                        <div className="absolute top-20 left-10 w-24 h-[2px] bg-emerald-600/30 rotate-45"></div>
                        <div className="absolute bottom-20 right-10 w-32 h-[2px] bg-emerald-600/30 -rotate-12"></div>
                        
                        {/* Procesador Snapdragon ficticio */}
                        <div className="relative z-10 mx-auto w-36 h-36 bg-zinc-900 border-2 border-zinc-800 rounded flex flex-col items-center justify-center shadow-lg shadow-black/80">
                          <Cpu className="h-10 w-10 text-zinc-500 mb-1" />
                          <span className="text-[10px] font-bold text-white font-mono tracking-wider">Snapdragon A15</span>
                          <span className="text-[8px] text-zinc-500 font-mono">QUALCOMM INC.</span>
                        </div>

                        {/* Pads de Test Point Destacados */}
                        <div className="relative z-10 w-full flex justify-around items-center p-3">
                          {/* Flex Conector Batería */}
                          <div className="w-14 h-6 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center text-[7px] text-zinc-500 font-mono font-medium">
                            FLEX BATT
                          </div>

                          {/* Los dos puntos amarillos para cortocircuito */}
                          <div className="flex flex-col items-center p-2 bg-zinc-900/90 border border-zinc-800 rounded-xl">
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
                        <p className="text-xs text-zinc-400 font-sans leading-relaxed">
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
                className="space-y-5"
              >
                
                {/* EXPLICACIÓN LEGAL */}
                <div className="bg-[#0c0c0e] border border-zinc-805 rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-start shadow-xl transition-all hover:border-zinc-800">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
                    <ShieldAlert className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1.5 font-display tracking-tight">Garantía de Ley y Responsabilidad Profesional</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                      De conformidad con las leyes nacionales en materia de delitos informáticos y telecomunicaciones (ej. Ley contra Delitos Informáticos), la alteración de IMEI o liberación sin auditoría de soporte puede derivar en contingencias legales graves. Este módulo asocia cada intervención en la "Guacharaca Suite" con un documento de identidad nacional, un IMEI de hardware certificado y el motivo técnico por el cual se realiza el puente EDL.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-in-up">
                  
                  {/* FORMULARIO DE REGISTRO */}
                  <div className="lg:col-span-5 bg-[#0c0c0e] border border-zinc-805 rounded-2xl p-5 shadow-xl transition-all hover:border-zinc-800">
                    <h3 className="text-xs font-semibold text-white mb-4 flex items-center gap-2 font-display uppercase tracking-widest text-[#fbbf24]">
                      <FileCheck className="h-4 w-4" />
                      Registrar Orden & Vínculo Legal
                    </h3>

                    <form onSubmit={handleAddAuditLog} className="space-y-4">
                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-1.5 font-mono uppercase tracking-wider">Dispositivo Intervenido:</label>
                        <select 
                          value={auditDispositivo}
                          onChange={(e) => setAuditDispositivo(Number(e.target.value))}
                          className="w-full bg-zinc-950/60 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                        >
                          {dispositivos.map(d => (
                            <option key={d.id} value={d.id}>{d.marca} {d.modelo} ({d.procesador})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-1.5 font-mono uppercase tracking-wider">Número de IMEI del Terminal (15 dígitos):</label>
                        <input 
                          type="text" 
                          required 
                          pattern="[0-9]{15}"
                          maxLength={15}
                          placeholder="Ej: 863489052281923"
                          value={auditImei}
                          onChange={(e) => setAuditImei(e.target.value)}
                          className="w-full bg-zinc-950/60 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono tracking-wider focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/35"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-1.5 font-mono uppercase tracking-wider">Nombre Completo del Propietario (Cliente):</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Ej: Juan Vicente Gómez"
                          value={auditCliente}
                          onChange={(e) => setAuditCliente(e.target.value)}
                          className="w-full bg-zinc-950/60 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-1.5 font-mono uppercase tracking-wider">Documento de Identidad Nacional (DNI / C.I.):</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Ej: V-25.102.834"
                          value={auditDoc}
                          onChange={(e) => setAuditDoc(e.target.value)}
                          className="w-full bg-zinc-950/60 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-1.5 font-mono uppercase tracking-wider">Motivo del Servicio o Diagnóstico Técnico:</label>
                        <textarea 
                          placeholder="Describa el problema. Ejemplo: Recuperación de álbum fotográfico familiar tras falla sistémica del sistema operativo..."
                          value={auditMotivo}
                          onChange={(e) => setAuditMotivo(e.target.value)}
                          className="w-full bg-zinc-950/60 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 h-20 resize-none"
                        />
                      </div>

                      {auditSuccessMsg && (
                        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-mono flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>¡Vínculo legal auditado y firmado con éxito!</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold font-mono py-2.5 px-4 rounded-xl text-xs transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                      >
                        Firmar y Almacenar en Supabase
                      </button>
                    </form>
                  </div>

                  {/* LOGS HISTÓRICOS DE TRANSACCIONES */}
                  <div className="lg:col-span-7 bg-[#0c0c0e] border border-zinc-805 rounded-2xl p-5 flex flex-col shadow-xl transition-all hover:border-zinc-800">
                    <h3 className="text-xs font-semibold text-white mb-4 flex items-center gap-2 font-display uppercase tracking-widest text-[#10b981]">
                      <Terminal className="h-4 w-4" />
                      Registro Histórico de Auditoría Inalterable (Logs)
                    </h3>

                    <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[480px] scrollbar-thin scrollbar-thumb-zinc-800">
                      {logsAuditoria.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500 text-xs font-sans">
                          No hay logs de auditoría legal registrados.
                        </div>
                      ) : (
                        logsAuditoria.map((log) => {
                          const disp = dispositivos.find(d => d.id === log.dispositivo_id);
                          return (
                            <div key={log.id} className="bg-zinc-950/45 p-4 rounded-xl border border-zinc-850 text-xs leading-normal space-y-2.5">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-semibold text-white text-sm block">Propietario: {log.cliente_nombre}</span>
                                  <span className="text-[10px] text-zinc-500 font-mono">D.I. Nacional: <strong className="text-zinc-300">{log.cliente_documento}</strong></span>
                                </div>
                                <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider">
                                  FIRMA OK
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 p-2.5 bg-zinc-950/80 border border-zinc-850 rounded-lg font-mono text-[10px] text-zinc-400">
                                <div>
                                  <span className="text-[9px] text-zinc-500 block uppercase tracking-wider">DISPOSITIVO</span>
                                  <span className="text-white font-medium">{disp ? `${disp.marca} ${disp.modelo}` : "Identidad Eliminada"}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-zinc-500 block uppercase tracking-wider">IMEI CERTIFICADO</span>
                                  <span className="text-white font-medium">{log.imei}</span>
                                </div>
                              </div>

                              <div>
                                <span className="text-[9px] text-zinc-500 font-mono block tracking-wider uppercase mb-0.5">JUSTIFICACIÓN TÉCNICA DEL INGENIERO:</span>
                                <p className="text-zinc-300 italic font-sans">"{log.motivo_servicio}"</p>
                              </div>

                              <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono border-t border-zinc-850 pt-2">
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
                className="space-y-5"
              >
                <div className="bg-[#0c0c0e] border border-zinc-805 rounded-2xl p-6 shadow-xl transition-all hover:border-zinc-800">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2 font-display tracking-tight">
                        <Key className="h-5 w-5 text-emerald-400" />
                        Esquema SQL de Supabase (PostgreSQL)
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        Copia y pega estas directrices directamente en el editor SQL de Supabase para generar la estructura, dependencias foreign-key e insertar el registro del Xiaomi Redmi Note 12.
                      </p>
                    </div>

                    <button
                      onClick={() => handleCopy(initialSqlSchema, 'sql')}
                      className="py-1.5 px-3 bg-[#18181b] border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60 text-zinc-300 hover:text-white rounded-xl flex items-center gap-1.5 font-mono text-xs transition-all cursor-pointer whitespace-nowrap"
                    >
                      {copiedState['sql'] ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-400" />
                          <span className="text-emerald-400">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 text-zinc-400" />
                          <span>Copiar Script SQL</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-850 font-mono text-[11.5px] leading-relaxed text-zinc-350 select-text overflow-x-auto max-h-[500px] scrollbar-thin scrollbar-thumb-zinc-800">
                    <pre>{initialSqlSchema}</pre>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-[#0c0c0e] p-5 rounded-2xl border border-zinc-805 text-xs leading-relaxed space-y-2 shadow-xl transition-all hover:border-zinc-800">
                    <span className="text-emerald-400 font-bold font-mono uppercase text-[10px] block tracking-wider">CORS e Inclusiones</span>
                    <p className="text-zinc-400 font-sans leading-relaxed">
                      Supabase proporciona de forma integrada un wrapper HTTP llamado **PostgREST** sobre tu base de datos PostgreSQL. Este mapea de forma inmediata tablas a JSON, permitiendo consultas asíncronas con filtros condicionales transparentes desde tu script de Python local sin necesidad de montar routers dedicados en NodeJS.
                    </p>
                  </div>
                  <div className="bg-[#0c0c0e] p-5 rounded-2xl border border-zinc-805 text-xs leading-relaxed space-y-2 shadow-xl transition-all hover:border-zinc-800">
                    <span className="text-cyan-400 font-bold font-mono uppercase text-[10px] block tracking-wider">Integridad Referencial</span>
                    <p className="text-zinc-400 font-sans leading-relaxed">
                      La tabla <code className="text-white">recursos_tecnicos</code> cuenta con un enlace referencial <code className="text-emerald-400 px-1 py-0.5 rounded bg-zinc-950/50 border border-zinc-850">ON DELETE CASCADE</code> conectado a la tabla madre <code className="text-white">dispositivos</code>. Al purgar un teléfono móvil, todos sus cargadores y esquemas udev se depurarán automáticamente de forma transaccional.
                    </p>
                  </div>
                  <div className="bg-[#0c0c0e] p-5 rounded-2xl border border-zinc-805 text-xs leading-relaxed space-y-2 shadow-xl transition-all hover:border-zinc-800">
                    <span className="text-amber-400 font-bold font-mono uppercase text-[10px] block tracking-wider">Acceso Restricto</span>
                    <p className="text-zinc-400 font-sans leading-relaxed">
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
