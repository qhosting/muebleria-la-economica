// Catálogo maestro extraído de las libretas de inventario de Mueblería La Económica
// e utilidades de cálculo financiero y conversión de moneda a letras para Pagaré.

export interface CatalogoItem {
  id: string;
  codigo: string;
  categoria: 'Estufas' | 'Lavadoras' | 'Electrodomésticos' | 'Audio y TV' | 'Salas' | 'Colchones' | 'Bases' | 'Roperos' | 'Cocinas y Muebles';
  nombre: string;
  marca: string;
  modelo?: string;
  tamano?: string;
  descripcion?: string;
  precioVenta: number;
  precioContado: number;
  stockSugerido?: number;
}

export const CATALOGO_PRODUCTOS_INICIAL: CatalogoItem[] = [
  // --- IMAGEN 1: ESTUFAS, LAVADORAS, LICUADORAS, PANTALLAS ---
  {
    id: 'est-whirlpool-wfr3000b',
    codigo: 'EST-WFR3000B',
    categoria: 'Estufas',
    nombre: 'Estufa Whirlpool WFR3000B Grande',
    marca: 'Whirlpool',
    modelo: 'WFR3000B',
    tamano: 'Grande',
    descripcion: 'Estufa de piso 30 pulgadas con quemadores de alta eficiencia',
    precioVenta: 9200,
    precioContado: 8200,
  },
  {
    id: 'est-iem-ei3520baps1b',
    codigo: 'EST-EI3520',
    categoria: 'Estufas',
    nombre: 'Estufa IEM EI3520BAPS1B Grande',
    marca: 'IEM',
    modelo: 'EI3520BAPS1B',
    tamano: 'Grande',
    descripcion: 'Estufa estándar encendido manual 6 quemadores',
    precioVenta: 7400,
    precioContado: 6600,
  },
  {
    id: 'est-mabe-em7641bain0b',
    codigo: 'EST-EM7641',
    categoria: 'Estufas',
    nombre: 'Estufa Mabe EM7641BAIN0B Grande',
    marca: 'Mabe',
    modelo: 'EM7641BAIN0B',
    tamano: 'Grande',
    descripcion: 'Estufa 30 pulgadas con encendido electrónico y horno panorámico',
    precioVenta: 10400,
    precioContado: 9300,
  },
  {
    id: 'est-iem-gabinete4',
    codigo: 'EST-IEM-GAB4',
    categoria: 'Estufas',
    nombre: 'Estufa IEM Gabinete 4 Quemadores',
    marca: 'IEM',
    modelo: 'Gabinete 4Q',
    tamano: 'Grande',
    descripcion: 'Gabinete 4 quemadores compacto con compartimento',
    precioVenta: 6200,
    precioContado: 5500,
  },
  {
    id: 'est-acros-mawi001',
    codigo: 'EST-MAWI001',
    categoria: 'Estufas',
    nombre: 'Estufa Acros MAWI001 4 Quemadores',
    marca: 'Acros',
    modelo: 'MAWI001',
    tamano: 'Mediano',
    descripcion: '4 Quemadores porcelanizada compacta',
    precioVenta: 5600,
    precioContado: 5000,
  },
  {
    id: 'est-mabe-tapacristal',
    codigo: 'EST-MABE-CRISTAL',
    categoria: 'Estufas',
    nombre: 'Estufa Mabe Tapa Cristal 6 Quemadores',
    marca: 'Mabe',
    modelo: 'Tapa Cristal 6Q',
    tamano: 'Grande',
    descripcion: 'Tapa cristal templado y 6 quemadores de lujo',
    precioVenta: 11500,
    precioContado: 10300,
  },
  {
    id: 'est-acros-6q',
    codigo: 'EST-ACROS-6Q',
    categoria: 'Estufas',
    nombre: 'Estufa Acros 6 Quemadores Grande',
    marca: 'Acros',
    modelo: '6 Quemadores',
    tamano: 'Grande',
    descripcion: 'Cubierta de acero inoxidable y 6 quemadores estándar',
    precioVenta: 8900,
    precioContado: 7900,
  },
  {
    id: 'lav-whirlpool-16k-auto',
    codigo: 'LAV-8MWTW1612',
    categoria: 'Lavadoras',
    nombre: 'Lavadora Whirlpool 16kg Automática',
    marca: 'Whirlpool',
    modelo: '8MWTW1612MJQ0',
    tamano: 'Grande',
    descripcion: '16 kilos automática con ciclos inteligentes',
    precioVenta: 11900,
    precioContado: 10600,
  },
  {
    id: 'lav-mabe-22k-auto',
    codigo: 'LAV-MABE-22K',
    categoria: 'Lavadoras',
    nombre: 'Lavadora Mabe 22kg Automática',
    marca: 'Mabe',
    modelo: 'Automática 22K',
    tamano: 'Grande',
    descripcion: 'Automática capacidad gigante 22 kilos',
    precioVenta: 14200,
    precioContado: 12800,
  },
  {
    id: 'lav-acros-alf2253e6',
    codigo: 'LAV-ALF2253E6',
    categoria: 'Lavadoras',
    nombre: 'Lavadora Acros Redonda 22kg',
    marca: 'Acros',
    modelo: 'ALF2253E6',
    tamano: 'Grande',
    descripcion: '22k redondo alta durabilidad tina porcelanizada',
    precioVenta: 7200,
    precioContado: 6400,
  },
  {
    id: 'lav-ge-lrg136',
    codigo: 'LAV-LRG136',
    categoria: 'Lavadoras',
    nombre: 'Lavadora GE Redonda 13kg',
    marca: 'GE',
    modelo: 'LRG136',
    tamano: 'Chica',
    descripcion: '13k redonda sistema tradicional',
    precioVenta: 5400,
    precioContado: 4800,
  },
  {
    id: 'centrifugadora-koblenz-6k',
    codigo: 'CEN-KOB-6K',
    categoria: 'Lavadoras',
    nombre: 'Centrifugadora Koblenz 6kg',
    marca: 'Koblenz',
    modelo: 'Secadora 6kg',
    tamano: 'Chico',
    descripcion: 'Centrífuga de alta velocidad 6 kilos',
    precioVenta: 3300,
    precioContado: 2900,
  },
  {
    id: 'lav-redonda-16k',
    codigo: 'LAV-RED-16K',
    categoria: 'Lavadoras',
    nombre: 'Lavadora Redonda 16kg',
    marca: 'Mabe / Easy / Acros',
    modelo: 'Redonda 16K',
    tamano: 'Chico',
    descripcion: '16 kilos redondo agitador recto',
    precioVenta: 6100,
    precioContado: 5400,
  },
  {
    id: 'lav-redonda-15k',
    codigo: 'LAV-RED-15K',
    categoria: 'Lavadoras',
    nombre: 'Lavadora Redonda 15kg',
    marca: 'Mabe / Easy / Acros',
    modelo: 'Redonda 15K',
    tamano: 'Chico',
    descripcion: '15 kilos redondo motor reversible',
    precioVenta: 5800,
    precioContado: 5200,
  },
  {
    id: 'lav-whirlpool-17k-auto',
    codigo: 'LAV-8MWTW1713',
    categoria: 'Lavadoras',
    nombre: 'Lavadora Whirlpool 17kg Automática',
    marca: 'Whirlpool',
    modelo: '8MWTW1713',
    tamano: 'Grande',
    descripcion: '17 kilos automática agitador doble acción',
    precioVenta: 12500,
    precioContado: 11200,
  },
  {
    id: 'lic-osterizer-cuadrada',
    codigo: 'LIC-BLST4108',
    categoria: 'Electrodomésticos',
    nombre: 'Licuadora Osterizer Cuadrada Clásica',
    marca: 'Osterizer',
    modelo: 'BLST4108-013',
    tamano: 'Chico',
    descripcion: 'Cuadrada vaso de vidrio motor metálico',
    precioVenta: 1350,
    precioContado: 1190,
  },
  {
    id: 'lic-oster-blstkapmpb',
    codigo: 'LIC-BLSTKAPMPB',
    categoria: 'Electrodomésticos',
    nombre: 'Licuadora Oster BLSTKAPMPB',
    marca: 'Oster',
    modelo: 'BLSTKAPMPB',
    tamano: 'Chico',
    descripcion: 'Vaso plástico resistente 2 velocidades más pulso',
    precioVenta: 990,
    precioContado: 890,
  },
  {
    id: 'lic-oster-2vasos',
    codigo: 'LIC-BLSTPYGB',
    categoria: 'Electrodomésticos',
    nombre: 'Licuadora Oster con 2 Vasos',
    marca: 'Oster',
    modelo: 'BLSTPYGB10RBG',
    tamano: 'Chico',
    descripcion: 'Con 2 vasos (vidrio y blend-n-go)',
    precioVenta: 1550,
    precioContado: 1380,
  },
  {
    id: 'tv-pantalla-32',
    codigo: 'TV-32-HD',
    categoria: 'Audio y TV',
    nombre: 'Pantalla 32" Smart TV HD',
    marca: 'Smart LED',
    modelo: '32 Pulgadas',
    tamano: 'Mediano',
    descripcion: 'Pantalla 32 pulgadas HD Smart TV con WiFi',
    precioVenta: 4200,
    precioContado: 3700,
  },
  {
    id: 'tv-pantalla-40',
    codigo: 'TV-40-FHD',
    categoria: 'Audio y TV',
    nombre: 'Pantalla 40" Smart TV Full HD',
    marca: 'Smart LED',
    modelo: '40 Pulgadas',
    tamano: 'Grande',
    descripcion: 'Pantalla 40 pulgadas Full HD Smart TV',
    precioVenta: 5600,
    precioContado: 4990,
  },

  // --- IMAGEN 2: PANTALLAS GRANDES, VITRINAS, COCINAS, ROPEROS ---
  {
    id: 'tv-pantalla-50',
    codigo: 'TV-50-4K',
    categoria: 'Audio y TV',
    nombre: 'Pantalla 50" Smart TV 4K UHD',
    marca: 'Smart LED',
    modelo: '50 Pulgadas',
    tamano: 'Grande',
    descripcion: 'Pantalla 50 pulgadas 4K Ultra HD aplicaciones integradas',
    precioVenta: 8200,
    precioContado: 7300,
  },
  {
    id: 'tv-pantalla-55',
    codigo: 'TV-55-4K',
    categoria: 'Audio y TV',
    nombre: 'Pantalla 55" Smart TV 4K UHD',
    marca: 'Smart LED',
    modelo: '55 Pulgadas',
    tamano: 'Grande',
    descripcion: 'Pantalla 55 pulgadas 4K HDR marcos delgados',
    precioVenta: 9800,
    precioContado: 8700,
  },
  {
    id: 'mue-vitrina-chica',
    codigo: 'MUE-VIT-CHICA',
    categoria: 'Cocinas y Muebles',
    nombre: 'Vitrina Chica con Espejo y Vidrio',
    marca: 'Mueblería La Económica',
    modelo: 'Vitrina Chica',
    tamano: 'Mediano',
    descripcion: 'Vitrina con puertas de cristal y repisas',
    precioVenta: 4100,
    precioContado: 3600,
  },
  {
    id: 'mue-vitrina-grande',
    codigo: 'MUE-VIT-GRANDE',
    categoria: 'Cocinas y Muebles',
    nombre: 'Vitrina Grande Alacena',
    marca: 'Mueblería La Económica',
    modelo: 'Vitrina Grande',
    tamano: 'Grande',
    descripcion: 'Vitrina grande con cajonera y lunas de cristal',
    precioVenta: 6400,
    precioContado: 5600,
  },
  {
    id: 'mue-tocador-leila',
    codigo: 'MUE-TOC-LEILA',
    categoria: 'Cocinas y Muebles',
    nombre: 'Tocador Leila con Espejo',
    marca: 'Mueblería La Económica',
    modelo: 'Leila',
    tamano: 'Grande',
    descripcion: 'Tocador estilo contemporáneo con luna y cajones amplios',
    precioVenta: 5900,
    precioContado: 5200,
  },
  {
    id: 'mue-cocina-tokio',
    codigo: 'MUE-COC-TOKIO',
    categoria: 'Cocinas y Muebles',
    nombre: 'Cocina Tokio 4 Piezas',
    marca: 'Mueblería La Económica',
    modelo: 'Tokio',
    tamano: 'Grande',
    descripcion: 'Cocina integral 4 piezas módulos alacena y tarja',
    precioVenta: 15500,
    precioContado: 13800,
  },
  {
    id: 'mue-cocina-clasica',
    codigo: 'MUE-COC-CLASICA',
    categoria: 'Cocinas y Muebles',
    nombre: 'Cocina Clásica 4 Piezas',
    marca: 'Mueblería La Económica',
    modelo: 'Clásica',
    tamano: 'Grande',
    descripcion: 'Cocina clásica en madera tratada 4 piezas',
    precioVenta: 13900,
    precioContado: 12400,
  },
  {
    id: 'mue-portatv-ginebra',
    codigo: 'MUE-PT-GINEBRA',
    categoria: 'Cocinas y Muebles',
    nombre: 'Porta Pantallas Ginebra',
    marca: 'Mueblería La Económica',
    modelo: 'Ginebra',
    tamano: 'Grande',
    descripcion: 'Centro de entretenimiento Ginebra para TV hasta 65 pulgadas',
    precioVenta: 4800,
    precioContado: 4200,
  },
  {
    id: 'mue-portatv-lombardia',
    codigo: 'MUE-PT-LOMBARDIA',
    categoria: 'Cocinas y Muebles',
    nombre: 'Porta Pantallas Lombardía 60',
    marca: 'Mueblería La Económica',
    modelo: 'Lombardía 60',
    tamano: 'Grande',
    descripcion: 'Mueble para TV estilo minimalista Lombardía 60',
    precioVenta: 5400,
    precioContado: 4700,
  },
  {
    id: 'rop-kingkong',
    codigo: 'ROP-KINGKONG',
    categoria: 'Roperos',
    nombre: 'Ropero King Kong Grande',
    marca: 'Mueblería La Económica',
    modelo: 'King Kong',
    tamano: 'Grande',
    descripcion: 'Ropero gigante con maletero y cajones reforzados',
    precioVenta: 8400,
    precioContado: 7400,
  },
  {
    id: 'rop-vallarta',
    codigo: 'ROP-VALLARTA',
    categoria: 'Roperos',
    nombre: 'Ropero Vallarta Mediano',
    marca: 'Mueblería La Económica',
    modelo: 'Vallarta',
    tamano: 'Mediano',
    descripcion: 'Ropero mediano 3 puertas acabado fino',
    precioVenta: 6300,
    precioContado: 5500,
  },
  {
    id: 'rop-capilla',
    codigo: 'ROP-CAPILLA',
    categoria: 'Roperos',
    nombre: 'Ropero Capilla Grande',
    marca: 'Mueblería La Económica',
    modelo: 'Capilla',
    tamano: 'Grande',
    descripcion: 'Ropero diseño arco capilla tradicional',
    precioVenta: 7800,
    precioContado: 6900,
  },
  {
    id: 'rop-karla',
    codigo: 'ROP-KARLA',
    categoria: 'Roperos',
    nombre: 'Ropero Karla Grande',
    marca: 'Mueblería La Económica',
    modelo: 'Karla',
    tamano: 'Grande',
    descripcion: 'Ropero moderno Karla con luna central',
    precioVenta: 7200,
    precioContado: 6400,
  },
  {
    id: 'rop-maletero',
    codigo: 'ROP-MALETERO',
    categoria: 'Roperos',
    nombre: 'Ropero Maletero Grande',
    marca: 'Mueblería La Económica',
    modelo: 'Ropero Maletero',
    tamano: 'Grande',
    descripcion: 'Ropero con doble maletero superior independiente',
    precioVenta: 7600,
    precioContado: 6700,
  },
  {
    id: 'rop-roma',
    codigo: 'ROP-ROMA',
    categoria: 'Roperos',
    nombre: 'Ropero Roma Grande',
    marca: 'Mueblería La Económica',
    modelo: 'Roma',
    tamano: 'Grande',
    descripcion: 'Ropero elegante modelo Roma 4 cajones y colgador',
    precioVenta: 7900,
    precioContado: 7000,
  },

  // --- IMAGEN 3: AUDIO KAISER, MICROONDAS, COLCHONES Y BASES ---
  {
    id: 'aud-bocina-msa0108',
    codigo: 'BOC-MSA0108',
    categoria: 'Audio y TV',
    nombre: 'Bocina Kaiser MSA-0108 Chica',
    marca: 'Kaiser',
    modelo: 'MSA-0108',
    tamano: 'Chica',
    descripcion: 'Bocina recargable Bluetooth con luces LED',
    precioVenta: 890,
    precioContado: 780,
  },
  {
    id: 'aud-barra-kbs3057',
    codigo: 'BAR-KBS3057',
    categoria: 'Audio y TV',
    nombre: 'Barra de Sonido Kaiser KBS-3057',
    marca: 'Kaiser',
    modelo: 'KBS-3057',
    tamano: 'Mediana',
    descripcion: 'Barra de sonido envolvente con subwoofer',
    precioVenta: 1490,
    precioContado: 1290,
  },
  {
    id: 'aud-bocina-kds1206',
    codigo: 'BOC-KDS1206',
    categoria: 'Audio y TV',
    nombre: 'Bocina Kaiser KDS-1206 Grande',
    marca: 'Kaiser',
    modelo: 'KDS-1206',
    tamano: 'Grande',
    descripcion: 'Bafle amplificado 15 pulgadas con micrófono y tripié',
    precioVenta: 2450,
    precioContado: 2150,
  },
  {
    id: 'elc-microondas-chico',
    codigo: 'MIC-MABE-07',
    categoria: 'Electrodomésticos',
    nombre: 'Microondas Mabe Chico 0.7 cu.ft',
    marca: 'Mabe',
    modelo: 'Chico',
    tamano: 'Chico',
    descripcion: 'Horno de microondas 0.7 pies cúbicos función descongelar',
    precioVenta: 2200,
    precioContado: 1950,
  },
  {
    id: 'elc-microondas-grande',
    codigo: 'MIC-MABE-11',
    categoria: 'Electrodomésticos',
    nombre: 'Microondas Mabe Grande 1.1 cu.ft',
    marca: 'Mabe',
    modelo: 'Grande',
    tamano: 'Grande',
    descripcion: 'Horno de microondas 1.1 pies cúbicos acero inoxidable',
    precioVenta: 3300,
    precioContado: 2950,
  },
  {
    id: 'elc-campana-mabe',
    codigo: 'CAM-MABE-MED',
    categoria: 'Electrodomésticos',
    nombre: 'Campana Extractora Mabe Mediana',
    marca: 'Mabe',
    modelo: 'Mediana',
    tamano: 'Mediana',
    descripcion: 'Campana purificadora de aire 60cm con filtro de carbón',
    precioVenta: 2500,
    precioContado: 2200,
  },
  {
    id: 'col-hotelero-mat',
    codigo: 'COL-HOT-MAT',
    categoria: 'Colchones',
    nombre: 'Colchón Hotelero Matrimonial',
    marca: 'Hotelero',
    modelo: 'Ortopédico Clásico',
    tamano: 'Matrimonial',
    descripcion: 'Colchón ortopédico firmeza media tela jacquard',
    precioVenta: 3100,
    precioContado: 2700,
  },
  {
    id: 'col-hotelero-ind',
    codigo: 'COL-HOT-IND',
    categoria: 'Colchones',
    nombre: 'Colchón Hotelero Individual',
    marca: 'Hotelero',
    modelo: 'Ortopédico Clásico',
    tamano: 'Individual',
    descripcion: 'Colchón individual ortopédico de resortes continuos',
    precioVenta: 2500,
    precioContado: 2200,
  },
  {
    id: 'col-restonic-mat',
    codigo: 'COL-RES-MAT',
    categoria: 'Colchones',
    nombre: 'Colchón Restonic Matrimonial',
    marca: 'Restonic',
    modelo: 'Restonic Plus',
    tamano: 'Matrimonial',
    descripcion: 'Tecnología Never Turn soporte lumbar reforzado',
    precioVenta: 4500,
    precioContado: 3990,
  },
  {
    id: 'col-restonic-king',
    codigo: 'COL-RES-KING',
    categoria: 'Colchones',
    nombre: 'Colchón Restonic King Size',
    marca: 'Restonic',
    modelo: 'Restonic Plus',
    tamano: 'King Size',
    descripcion: 'King size confort premium tratamiento antibacterial',
    precioVenta: 6900,
    precioContado: 6100,
  },
  {
    id: 'col-america-mat',
    codigo: 'COL-AME-MAT',
    categoria: 'Colchones',
    nombre: 'Colchón América Matrimonial',
    marca: 'América',
    modelo: 'América Deluxe',
    tamano: 'Matrimonial',
    descripcion: 'Colchoneta Pillow Top extra suave resortes embolsados',
    precioVenta: 4900,
    precioContado: 4350,
  },
  {
    id: 'col-springair-mat',
    codigo: 'COL-SPR-MAT',
    categoria: 'Colchones',
    nombre: 'Colchón Spring Air Matrimonial',
    marca: 'Spring Air',
    modelo: 'Back Supporter',
    tamano: 'Matrimonial',
    descripcion: 'Avalado por quiroprácticos tela stretch fresca',
    precioVenta: 5800,
    precioContado: 5100,
  },
  {
    id: 'col-springair-king',
    codigo: 'COL-SPR-KING',
    categoria: 'Colchones',
    nombre: 'Colchón Spring Air King Size',
    marca: 'Spring Air',
    modelo: 'Back Supporter',
    tamano: 'King Size',
    descripcion: 'King size sistema posture spiral cero transmisión de movimiento',
    precioVenta: 8600,
    precioContado: 7600,
  },
  {
    id: 'col-celta-mat',
    codigo: 'COL-CEL-MAT',
    categoria: 'Colchones',
    nombre: 'Colchón Celta Matrimonial',
    marca: 'Celta',
    modelo: 'Celta Comfort',
    tamano: 'Matrimonial',
    descripcion: 'Colchón matrimonial semi-ortopédico',
    precioVenta: 4100,
    precioContado: 3600,
  },
  {
    id: 'col-hercules-mat',
    codigo: 'COL-HER-MAT',
    categoria: 'Colchones',
    nombre: 'Colchón Hércules Matrimonial',
    marca: 'Hércules',
    modelo: 'Hércules Ultra',
    tamano: 'Matrimonial',
    descripcion: 'Estructura pesada alto soporte ortopédico',
    precioVenta: 3950,
    precioContado: 3490,
  },
  {
    id: 'col-soberano-mat',
    codigo: 'COL-SOB-MAT',
    categoria: 'Colchones',
    nombre: 'Colchón Soberano Matrimonial',
    marca: 'Soberano',
    modelo: 'Soberano Real',
    tamano: 'Matrimonial',
    descripcion: 'Acolchado profundo doble vista',
    precioVenta: 4600,
    precioContado: 4050,
  },
  {
    id: 'col-pensilvania-mat',
    codigo: 'COL-PEN-MAT',
    categoria: 'Colchones',
    nombre: 'Colchón Pensilvania Matrimonial',
    marca: 'Pensilvania',
    modelo: 'Pensilvania Foam',
    tamano: 'Matrimonial',
    descripcion: 'Núcleo de alta densidad y resortes bicónicos',
    precioVenta: 4300,
    precioContado: 3800,
  },
  {
    id: 'col-alaska-mat',
    codigo: 'COL-ALA-MAT',
    categoria: 'Colchones',
    nombre: 'Colchón Alaska Matrimonial',
    marca: 'Alaska',
    modelo: 'Alaska Fresh',
    tamano: 'Matrimonial',
    descripcion: 'Tela térmica fresca diseño moderno',
    precioVenta: 4400,
    precioContado: 3900,
  },
  {
    id: 'col-quebec-mat',
    codigo: 'COL-QUE-MAT',
    categoria: 'Colchones',
    nombre: 'Colchón Quebec Matrimonial',
    marca: 'Quebec',
    modelo: 'Quebec Elegance',
    tamano: 'Matrimonial',
    descripcion: 'Capitoneado fino y soporte firme',
    precioVenta: 4900,
    precioContado: 4300,
  },
  {
    id: 'bas-tubular-mat',
    codigo: 'BAS-TUB-MAT',
    categoria: 'Bases',
    nombre: 'Base de Cama Tubular Matrimonial',
    marca: 'Mueblería La Económica',
    modelo: 'Tubular',
    tamano: 'Matrimonial',
    descripcion: 'Estructura de acero tubular reforzada con pintura horneada',
    precioVenta: 2100,
    precioContado: 1850,
  },
  {
    id: 'bas-tubular-ind',
    codigo: 'BAS-TUB-IND',
    categoria: 'Bases',
    nombre: 'Base de Cama Tubular Individual',
    marca: 'Mueblería La Económica',
    modelo: 'Tubular',
    tamano: 'Individual',
    descripcion: 'Base tubular individual reforzada',
    precioVenta: 1650,
    precioContado: 1450,
  },
  {
    id: 'bas-tactopiel-mat',
    codigo: 'BAS-TAC-MAT',
    categoria: 'Bases',
    nombre: 'Base de Cama Tactopiel Matrimonial',
    marca: 'Mueblería La Económica',
    modelo: 'Tactopiel',
    tamano: 'Matrimonial',
    descripcion: 'Base tapizada en tactopiel chocolate o negro fácil de limpiar',
    precioVenta: 2800,
    precioContado: 2450,
  },
  {
    id: 'bas-madera-mat',
    codigo: 'BAS-MAD-MAT',
    categoria: 'Bases',
    nombre: 'Base de Cama Madera Matrimonial',
    marca: 'Mueblería La Económica',
    modelo: 'Madera Sólida',
    tamano: 'Matrimonial',
    descripcion: 'Base fabricada en madera de pino sólida cepillada',
    precioVenta: 3100,
    precioContado: 2750,
  },
  {
    id: 'bas-infantil-nina',
    codigo: 'BAS-INF-NINA',
    categoria: 'Bases',
    nombre: 'Base de Cama Infantil NIÑA Individual',
    marca: 'Mueblería La Económica',
    modelo: 'Niña Decorada',
    tamano: 'Individual',
    descripcion: 'Base decorativa infantil con cabecera tono rosa',
    precioVenta: 2400,
    precioContado: 2100,
  },
  {
    id: 'bas-infantil-nino',
    codigo: 'BAS-INF-NINO',
    categoria: 'Bases',
    nombre: 'Base de Cama Infantil NIÑO Individual',
    marca: 'Mueblería La Económica',
    modelo: 'Niño Decorado',
    tamano: 'Individual',
    descripcion: 'Base decorativa infantil con cabecera tono azul/rojo',
    precioVenta: 2400,
    precioContado: 2100,
  },

  // --- IMAGEN 4: SALAS, SILLONES Y ELECTRO MENORES ---
  {
    id: 'sal-esquinera',
    codigo: 'SAL-ESQUINERA',
    categoria: 'Salas',
    nombre: 'Sala Esquinera Grande',
    marca: 'Mueblería La Económica',
    modelo: 'Esquinera Familiar',
    tamano: 'Grande',
    descripcion: 'Sala modular esquinera con cojines decorativos desmontables',
    precioVenta: 13900,
    precioContado: 12400,
  },
  {
    id: 'sal-reclinable',
    codigo: 'SAL-RECLINABLE',
    categoria: 'Salas',
    nombre: 'Sala Reclinable Confort Grande',
    marca: 'Mueblería La Económica',
    modelo: 'Reclinable',
    tamano: 'Grande',
    descripcion: 'Sala con módulos reclinables multiposición de alta gama',
    precioVenta: 17500,
    precioContado: 15600,
  },
  {
    id: 'sil-tantrico',
    codigo: 'SIL-TANTRICO',
    categoria: 'Salas',
    nombre: 'Sillón Tántrico Ergonómico Grande',
    marca: 'Mueblería La Económica',
    modelo: 'Tántrico Curve',
    tamano: 'Grande',
    descripcion: 'Sillón curvo ergonómico tapizado en tactopiel de lujo',
    precioVenta: 5100,
    precioContado: 4500,
  },
  {
    id: 'sil-asturias',
    codigo: 'SIL-ASTURIAS',
    categoria: 'Salas',
    nombre: 'Sillón Individual Asturias Grande',
    marca: 'Mueblería La Económica',
    modelo: 'Asturias',
    tamano: 'Grande',
    descripcion: 'Sillón orejero de descanso modelo Asturias',
    precioVenta: 4400,
    precioContado: 3900,
  },
  {
    id: 'sal-3piezas',
    codigo: 'SAL-3PIEZAS',
    categoria: 'Salas',
    nombre: 'Sala Clásica 3 Piezas (3-2-1)',
    marca: 'Mueblería La Económica',
    modelo: '3 Piezas Clásica',
    tamano: 'Grande',
    descripcion: 'Juego de sala compuesto por Sofá, Love Seat y Sillón individual',
    precioVenta: 14800,
    precioContado: 13200,
  },
  {
    id: 'caf-oster-chica',
    codigo: 'CAF-OSTER-CH',
    categoria: 'Electrodomésticos',
    nombre: 'Cafetera Oster 12 Tazas',
    marca: 'Oster',
    modelo: 'Cafetera Filtro',
    tamano: 'Chico',
    descripcion: 'Cafetera programable con jarra de vidrio',
    precioVenta: 790,
    precioContado: 690,
  },
  {
    id: 'pla-oster-vapor',
    codigo: 'PLA-OSTER',
    categoria: 'Electrodomésticos',
    nombre: 'Plancha Oster a Vapor',
    marca: 'Oster',
    modelo: 'Vapor Suela Antiadherente',
    tamano: 'Chico',
    descripcion: 'Plancha con golpe de vapor continuo',
    precioVenta: 590,
    precioContado: 490,
  },
  {
    id: 'pla-koblenz-seca',
    codigo: 'PLA-KOBLENZ',
    categoria: 'Electrodomésticos',
    nombre: 'Plancha Koblenz Resistente',
    marca: 'Koblenz',
    modelo: 'Clásica',
    tamano: 'Chico',
    descripcion: 'Plancha ligera de calentamiento rápido',
    precioVenta: 490,
    precioContado: 420,
  },
  {
    id: 'bat-neohaus-chica',
    codigo: 'BAT-NEOHAUS',
    categoria: 'Electrodomésticos',
    nombre: 'Batidora NeoHaus Pedestal y Manual',
    marca: 'NeoHaus',
    modelo: 'PowerMix',
    tamano: 'Chico',
    descripcion: 'Batidora con tazón giratorio y aspas metálicas',
    precioVenta: 920,
    precioContado: 820,
  }
];

// Conversión de importes numéricos a texto formal mexicano (ej: "CUATRO MIL QUINIENTOS PESOS 00/100 M.N.")
export function numeroALetras(monto: number): string {
  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenasEspeciales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const decenas = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  function convertirCentenas(num: number): string {
    if (num === 0) return '';
    if (num === 100) return 'CIEN';
    const c = Math.floor(num / 100);
    const d = Math.floor((num % 100) / 10);
    const u = num % 10;

    let res = '';
    if (c > 0) res += centenas[c] + ' ';

    if (d === 1) {
      res += decenasEspeciales[u];
    } else if (d === 2) {
      if (u === 0) res += 'VEINTE';
      else res += 'VEINTI' + unidades[u];
    } else if (d > 2) {
      res += decenas[d];
      if (u > 0) res += ' Y ' + unidades[u];
    } else if (u > 0) {
      res += unidades[u];
    }
    return res.trim();
  }

  const partes = monto.toFixed(2).split('.');
  let entero = parseInt(partes[0], 10);
  const centavos = partes[1] || '00';

  if (entero === 0) return `CERO PESOS ${centavos}/100 M.N.`;

  let resultado = '';
  const millones = Math.floor(entero / 1000000);
  entero %= 1000000;
  const miles = Math.floor(entero / 1000);
  const resto = entero % 1000;

  if (millones > 0) {
    if (millones === 1) resultado += 'UN MILLÓN ';
    else resultado += convertirCentenas(millones) + ' MILLONES ';
  }

  if (miles > 0) {
    if (miles === 1) resultado += 'MIL ';
    else resultado += convertirCentenas(miles) + ' MIL ';
  }

  if (resto > 0) {
    resultado += convertirCentenas(resto) + ' ';
  }

  return `${resultado.trim()} PESOS ${centavos}/100 M.N.`;
}

// Formateador de fecha formal para contrato: "Aculco, Edo. de Méx., a 06 de Septiembre de 2026"
export function formatearFechaLegal(fecha: Date = new Date()): {
  dia: string;
  mes: string;
  anio: string;
  textoCompleto: string;
} {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const d = fecha.getDate().toString().padStart(2, '0');
  const m = meses[fecha.getMonth()];
  const y = fecha.getFullYear().toString();

  return {
    dia: d,
    mes: m,
    anio: y,
    textoCompleto: `Aculco, Edo. de Méx., a ${d} de ${m} de ${y}`
  };
}

// Simulador y calculador de cuotas de financiamiento
export interface PlanCreditoCalculado {
  subtotal: number;
  enganche: number;
  saldoFinanciado: number;
  periodicidad: 'semanal' | 'quincenal' | 'mensual';
  numeroPagos: number;
  montoCuota: number;
  totalCredito: number;
}

export function calcularPlanCredito(
  total: number,
  enganche: number,
  periodicidad: 'semanal' | 'quincenal' | 'mensual' = 'semanal',
  numeroPagos: number = 26 // Por defecto 6 meses semanal aprox (26 semanas)
): PlanCreditoCalculado {
  const engancheEfectivo = Math.max(0, Math.min(total, enganche || 0));
  const saldoFinanciado = Math.max(0, total - engancheEfectivo);
  
  // En mueblería el precio de lista ya contempla el financiamiento o se prorratea
  const cuota = numeroPagos > 0 ? Math.ceil(saldoFinanciado / numeroPagos) : 0;
  
  return {
    subtotal: total,
    enganche: engancheEfectivo,
    saldoFinanciado,
    periodicidad,
    numeroPagos,
    montoCuota: cuota,
    totalCredito: engancheEfectivo + (cuota * numeroPagos)
  };
}
