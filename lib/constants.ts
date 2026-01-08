export const ADMIN_EMAILS = [
    'ai.management@archipielagofilm.com',
    'ia.lantica@lanticastudios.com',
    // Federico Berón removido de admins - ahora es user regular
    // Cindy Toribio removida de admins - ahora es user regular
    'cindy.vejar@lanticastudios.com', // Por si Cindy Vejar es Cindy Toribio
];

// ID of the dedicated Finance folder in Google Drive for receipts/invoices
export const FINANCE_DRIVE_FOLDER_ID = '1N91xMmBLVJwYdGOTzLQfWE9SrGZGWbp6';

// Folder name for Task Attachments (will be created if doesn't exist)
export const TASKS_ATTACHMENTS_FOLDER_NAME = 'Task_Attachments';

export const isUserAdmin = (email?: string | null) => {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase());
};

// --- Production Constants ---

export const DEPARTMENTS = [
    'Management & Technical',
    'Creative Leadership',
    'AI Content Generation',
    'Business Operations',
    'Post-Production',
    'Producción', 'Dirección', 'Cámara', 'Iluminación (G&E)', 'Arte',
    'Sonido', 'Vestuario', 'Maquillaje', 'Locaciones', 'Otro'
];

export const ROLES: Record<string, string[]> = {
    'Management & Technical': [
        'Line Producer', 'A.I. Project Manager', 'Data & Systems Engineer',
        'Cloud Infrastructure Manager', 'Workflow Technical Director',
        '2nd Ops Security Specialist', 'A.I. R&D Lead', 'Production Coordinator',
        'Graphic Designer / Editor Jr.', 'Technical Support Specialist'
    ],
    'Creative Leadership': [
        'Director', 'Creative Director', 'Cinematographer (DoP)', 'Production Designer',
        'Art Director', 'Writer', 'Character Design / Casting', '1st AD / Script Supervisor'
    ],
    'AI Content Generation': [
        'AI Content Generation Supervisor', 'AI Prompt Generation Artist',
        'AI Operator (Video)', 'AI Operator (Image)', 'AI Operator (Audio)',
        'AI Music Composer', 'AI Voice Generation Artist'
    ],
    'Business Operations': [
        'Accounting', 'Legal Specialist'
    ],
    'Post-Production': [
        'Editing Supervisor', 'Editor', 'VFX Inspector', 'Colorist', 'Sound Designer'
    ],
    // Legacy / Standard Departments
    'Producción': ['Productor Ejecutivo', 'Productor de Línea', 'Gerente de Producción (UPM)', 'Coordinador de Producción', 'Asistente de Producción (PA)', 'Runner'],
    'Dirección': ['Director', '1er Asistente de Dirección (1AD)', '2do Asistente de Dirección (2AD)', 'Script Supervisor'],
    'Cámara': ['Director de Fotografía (DoP)', 'Operador de Cámara', '1er Asistente de Cámara (1st AC)', '2do Asistente de Cámara (2nd AC)', 'DIT', 'Video Assist'],
    'Iluminación (G&E)': ['Gaffer', 'Best Boy Electric', 'Key Grip', 'Best Boy Grip', 'Dolly Grip', 'Eléctrico', 'Grip'],
    'Arte': ['Diseñador de Producción', 'Director de Arte', 'Set Decorator', 'Prop Master', 'Utilero', 'Leadman', 'Swing'],
    'Sonido': ['Sonidista (Mixer)', 'Boom Operator', 'Utilero de Sonido'],
    'Vestuario': ['Diseñador de Vestuario', 'Supervisor de Vestuario', 'Asistente de Vestuario'],
    'Maquillaje': ['Jefe de Maquillaje', 'Maquillador', 'Peluquero'],
    'Locaciones': ['Gerente de Locaciones', 'Asistente de Locaciones'],
    'Otro': ['Consultor', 'Talento', 'Extra', 'Chofer', 'Catering', 'Seguridad']
};
