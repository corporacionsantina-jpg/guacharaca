export interface Dispositivo {
  id: number;
  marca: string;
  modelo: string;
  procesador: string;
  chipset_id: string; // Ej: '05c6:9008' (EDL) o similar
  created_at?: string;
}

export interface RecursoTecnico {
  id: number;
  dispositivo_id: number;
  tipo_recurso: 'firehose' | 'test_point' | 'preloader';
  url_archivo: string;
  notas_tecnicas: string;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  dispositivo_id: number;
  imei: string;
  cliente_nombre: string;
  cliente_documento: string;
  motivo_servicio: string;
  timestamp: string;
  estado: 'Pendiente' | 'Completado' | 'Error';
}
