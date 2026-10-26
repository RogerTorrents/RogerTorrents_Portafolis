import type { Idioma } from '../services/translation.service';

/**
 * Textos legals: política de privacitat (RGPD art. 13 i LOPDGDD) i avís legal
 * (LSSI-CE art. 10). Si es comença a recollir alguna dada nova (formulari,
 * analítica...), s'han de revisar i actualitzar `DATA_ACTUALITZACIO`.
 */
export type PestanyaLegal = 'privacitat' | 'avis';

export interface SeccioLegal {
  readonly titol: string;
  readonly paragrafs: readonly string[];
}

export interface DocumentLegal {
  readonly titol: string;
  readonly seccions: readonly SeccioLegal[];
}

export const DATA_ACTUALITZACIO = '19/10/2026';
export const TITULAR = 'Roger Torrents Gabalda';
export const EMAIL_CONTACTE = 'rogertorrentsgabalda@gmail.com';

export const TEXTOS_LEGALS: Readonly<Record<Idioma, Readonly<Record<PestanyaLegal, DocumentLegal>>>> = {
  ca: {
    privacitat: {
      titol: 'Política de privacitat',
      seccions: [
        {
          titol: 'Responsable del tractament',
          paragrafs: [
            `${TITULAR}. Contacte: ${EMAIL_CONTACTE}.`,
            'Aquest web és un portafolis personal sense activitat comercial. Només es recullen les dades imprescindibles perquè les aplicacions funcionin.',
          ],
        },
        {
          titol: 'Quines dades es recullen i per a què',
          paragrafs: [
            'GeoExplorer i Som-hi (compte compartit): nom, email i contrasenya (desada xifrada, mai en text pla), i el contingut que hi creïs (llocs i categories del mapa personal; plans i entrenaments). S\'utilitzen únicament per identificar-te i desar el teu contingut.',
            'Juguem al Truc: el nom de jugador que escriguis. Només existeix a la memòria del servidor mentre dura la sala i s\'esborra automàticament; no es desa enlloc.',
            'L\'Impostor: la categoria que escriguis s\'envia al servei d\'IA Groq per generar les paraules de la partida. No es desa. No hi escriguis dades personals.',
            'Ubicació (GeoExplorer): només si la permets al navegador, s\'utilitza per centrar el mapa al teu dispositiu. No s\'envia ni es desa al servidor.',
          ],
        },
        {
          titol: 'Base legal',
          paragrafs: [
            'El tractament de les dades del compte es basa en la prestació del servei que sol·licites en registrar-te (art. 6.1.b RGPD). La resta de funcions s\'utilitzen per iniciativa teva i pots deixar de fer-les servir en qualsevol moment.',
          ],
        },
        {
          titol: 'Conservació',
          paragrafs: [
            'Les dades del compte es conserven mentre el compte existeixi. En eliminar-lo (opció "Eliminar compte" de GeoExplorer o Som-hi) s\'esborren definitivament el compte i tot el seu contingut a les dues aplicacions.',
            'Les sessions iniciades caduquen al cap de 7 dies com a màxim.',
          ],
        },
        {
          titol: 'Destinataris',
          paragrafs: [
            'No es cedeixen dades a tercers ni s\'utilitzen per a publicitat. Hi tenen accés tècnic només el proveïdor d\'allotjament dels servidors, com a encarregat del tractament, i Groq Inc. (EUA) per al text de L\'Impostor, sota les clàusules contractuals tipus de la Comissió Europea.',
            'Els mapes de GeoExplorer es carreguen directament des d\'OpenStreetMap, OpenTopoMap i Esri, que reben l\'adreça IP del teu navegador per servir les imatges. L\'enllaç "Com arribar-hi" obre Google Maps només si hi fas clic.',
          ],
        },
        {
          titol: 'Galetes i emmagatzematge local',
          paragrafs: [
            'Aquest web no utilitza galetes de seguiment, analítica ni publicitat. Només desa al teu navegador (localStorage/sessionStorage) dades tècniques imprescindibles: la sessió iniciada, el progrés dels jocs i preferències de visualització. Les pots esborrar quan vulguis des del navegador.',
          ],
        },
        {
          titol: 'Els teus drets',
          paragrafs: [
            `Pots exercir els drets d'accés, rectificació, supressió, oposició, limitació i portabilitat escrivint a ${EMAIL_CONTACTE}. La supressió també la pots fer directament amb l'opció "Eliminar compte".`,
            'Si consideres que no s\'han respectat els teus drets, pots presentar una reclamació a l\'Agència Espanyola de Protecció de Dades (www.aepd.es).',
          ],
        },
        {
          titol: 'Menors d\'edat',
          paragrafs: [
            'Per crear un compte cal tenir com a mínim 14 anys (art. 7 LOPDGDD). Per sota d\'aquesta edat cal el consentiment del pare, mare o tutor legal.',
          ],
        },
        {
          titol: 'Seguretat',
          paragrafs: [
            'Les comunicacions viatgen xifrades (HTTPS), les contrasenyes es desen amb hash bcrypt i els intents d\'inici de sessió estan limitats per evitar atacs.',
          ],
        },
      ],
    },
    avis: {
      titol: 'Avís legal',
      seccions: [
        {
          titol: 'Titular del web',
          paragrafs: [
            `En compliment de l'art. 10 de la Llei 34/2002 (LSSI-CE): titular, ${TITULAR}; correu de contacte, ${EMAIL_CONTACTE}.`,
          ],
        },
        {
          titol: 'Objecte',
          paragrafs: [
            'Aquest web és el portafolis personal i professional del titular. Mostra projectes propis amb finalitat demostrativa, sense cap activitat comercial ni venda de productes o serveis.',
          ],
        },
        {
          titol: 'Propietat intel·lectual',
          paragrafs: [
            'El codi, el disseny i els textos d\'aquest web són obra del titular, llevat que s\'indiqui el contrari. Les marques, logotips i imatges de tercers que hi puguin aparèixer pertanyen als seus respectius titulars i s\'hi mostren només amb finalitat il·lustrativa, sense que impliqui cap relació ni patrocini.',
            'Si ets titular d\'algun contingut i consideres que se n\'ha fet un ús indegut, escriu al correu de contacte i es retirarà.',
          ],
        },
      ],
    },
  },
  es: {
    privacitat: {
      titol: 'Política de privacidad',
      seccions: [
        {
          titol: 'Responsable del tratamiento',
          paragrafs: [
            `${TITULAR}. Contacto: ${EMAIL_CONTACTE}.`,
            'Esta web es un portafolio personal sin actividad comercial. Solo se recogen los datos imprescindibles para que las aplicaciones funcionen.',
          ],
        },
        {
          titol: 'Qué datos se recogen y para qué',
          paragrafs: [
            'GeoExplorer y Som-hi (cuenta compartida): nombre, email y contraseña (guardada cifrada, nunca en texto plano), y el contenido que crees (lugares y categorías del mapa personal; planes y entrenamientos). Se usan únicamente para identificarte y guardar tu contenido.',
            'Juguem al Truc: el nombre de jugador que escribas. Solo existe en la memoria del servidor mientras dura la sala y se borra automáticamente; no se guarda en ningún sitio.',
            'L\'Impostor: la categoría que escribas se envía al servicio de IA Groq para generar las palabras de la partida. No se guarda. No escribas datos personales.',
            'Ubicación (GeoExplorer): solo si la permites en el navegador, se usa para centrar el mapa en tu dispositivo. No se envía ni se guarda en el servidor.',
          ],
        },
        {
          titol: 'Base legal',
          paragrafs: [
            'El tratamiento de los datos de la cuenta se basa en la prestación del servicio que solicitas al registrarte (art. 6.1.b RGPD). El resto de funciones se usan por iniciativa tuya y puedes dejar de usarlas en cualquier momento.',
          ],
        },
        {
          titol: 'Conservación',
          paragrafs: [
            'Los datos de la cuenta se conservan mientras la cuenta exista. Al eliminarla (opción "Eliminar cuenta" de GeoExplorer o Som-hi) se borran definitivamente la cuenta y todo su contenido en las dos aplicaciones.',
            'Las sesiones iniciadas caducan a los 7 días como máximo.',
          ],
        },
        {
          titol: 'Destinatarios',
          paragrafs: [
            'No se ceden datos a terceros ni se usan para publicidad. Solo tienen acceso técnico el proveedor de alojamiento de los servidores, como encargado del tratamiento, y Groq Inc. (EE. UU.) para el texto de L\'Impostor, bajo las cláusulas contractuales tipo de la Comisión Europea.',
            'Los mapas de GeoExplorer se cargan directamente desde OpenStreetMap, OpenTopoMap y Esri, que reciben la dirección IP de tu navegador para servir las imágenes. El enlace "Cómo llegar" abre Google Maps solo si haces clic.',
          ],
        },
        {
          titol: 'Cookies y almacenamiento local',
          paragrafs: [
            'Esta web no usa cookies de seguimiento, analítica ni publicidad. Solo guarda en tu navegador (localStorage/sessionStorage) datos técnicos imprescindibles: la sesión iniciada, el progreso de los juegos y preferencias de visualización. Puedes borrarlos cuando quieras desde el navegador.',
          ],
        },
        {
          titol: 'Tus derechos',
          paragrafs: [
            `Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a ${EMAIL_CONTACTE}. La supresión también puedes hacerla directamente con la opción "Eliminar cuenta".`,
            'Si consideras que no se han respetado tus derechos, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es).',
          ],
        },
        {
          titol: 'Menores de edad',
          paragrafs: [
            'Para crear una cuenta hay que tener al menos 14 años (art. 7 LOPDGDD). Por debajo de esa edad se necesita el consentimiento del padre, madre o tutor legal.',
          ],
        },
        {
          titol: 'Seguridad',
          paragrafs: [
            'Las comunicaciones viajan cifradas (HTTPS), las contraseñas se guardan con hash bcrypt y los intentos de inicio de sesión están limitados para evitar ataques.',
          ],
        },
      ],
    },
    avis: {
      titol: 'Aviso legal',
      seccions: [
        {
          titol: 'Titular de la web',
          paragrafs: [
            `En cumplimiento del art. 10 de la Ley 34/2002 (LSSI-CE): titular, ${TITULAR}; correo de contacto, ${EMAIL_CONTACTE}.`,
          ],
        },
        {
          titol: 'Objeto',
          paragrafs: [
            'Esta web es el portafolio personal y profesional del titular. Muestra proyectos propios con finalidad demostrativa, sin ninguna actividad comercial ni venta de productos o servicios.',
          ],
        },
        {
          titol: 'Propiedad intelectual',
          paragrafs: [
            'El código, el diseño y los textos de esta web son obra del titular, salvo que se indique lo contrario. Las marcas, logotipos e imágenes de terceros que puedan aparecer pertenecen a sus respectivos titulares y se muestran solo con finalidad ilustrativa, sin que implique ninguna relación ni patrocinio.',
            'Si eres titular de algún contenido y consideras que se ha hecho un uso indebido, escribe al correo de contacto y se retirará.',
          ],
        },
      ],
    },
  },
  en: {
    privacitat: {
      titol: 'Privacy policy',
      seccions: [
        {
          titol: 'Data controller',
          paragrafs: [
            `${TITULAR}. Contact: ${EMAIL_CONTACTE}.`,
            'This website is a personal portfolio with no commercial activity. Only the data strictly needed for the apps to work is collected.',
          ],
        },
        {
          titol: 'What data is collected and why',
          paragrafs: [
            'GeoExplorer and Som-hi (shared account): name, email and password (stored hashed, never in plain text), and the content you create (places and categories on your personal map; plans and workouts). Used only to identify you and save your content.',
            'Juguem al Truc: the player name you type. It only exists in the server\'s memory while the room lasts and is deleted automatically; it is never stored.',
            'L\'Impostor: the category you type is sent to the Groq AI service to generate the game words. It is not stored. Do not type personal data.',
            'Location (GeoExplorer): only if you allow it in your browser, it is used to centre the map on your device. It is never sent to or stored on the server.',
          ],
        },
        {
          titol: 'Legal basis',
          paragrafs: [
            'Account data is processed to provide the service you request when signing up (art. 6.1.b GDPR). The other features are used on your own initiative and you can stop using them at any time.',
          ],
        },
        {
          titol: 'Retention',
          paragrafs: [
            'Account data is kept while the account exists. When you delete it ("Delete account" option in GeoExplorer or Som-hi), the account and all its content in both apps are permanently erased.',
            'Login sessions expire after 7 days at most.',
          ],
        },
        {
          titol: 'Recipients',
          paragrafs: [
            'No data is shared with third parties or used for advertising. Only the server hosting provider, as data processor, and Groq Inc. (USA), for L\'Impostor text, have technical access, under the European Commission\'s standard contractual clauses.',
            'GeoExplorer maps are loaded directly from OpenStreetMap, OpenTopoMap and Esri, which receive your browser\'s IP address to serve the images. The "Directions" link opens Google Maps only if you click it.',
          ],
        },
        {
          titol: 'Cookies and local storage',
          paragrafs: [
            'This website uses no tracking, analytics or advertising cookies. It only stores strictly necessary technical data in your browser (localStorage/sessionStorage): your login session, game progress and display preferences. You can clear it at any time from your browser.',
          ],
        },
        {
          titol: 'Your rights',
          paragrafs: [
            `You can exercise your rights of access, rectification, erasure, objection, restriction and portability by writing to ${EMAIL_CONTACTE}. You can also erase your data directly with the "Delete account" option.`,
            'If you believe your rights have not been respected, you can file a complaint with the Spanish Data Protection Agency (www.aepd.es).',
          ],
        },
        {
          titol: 'Minors',
          paragrafs: [
            'You must be at least 14 years old to create an account (art. 7 LOPDGDD). Below that age, consent from a parent or legal guardian is required.',
          ],
        },
        {
          titol: 'Security',
          paragrafs: [
            'All traffic is encrypted (HTTPS), passwords are stored with bcrypt hashing and login attempts are rate-limited to prevent attacks.',
          ],
        },
      ],
    },
    avis: {
      titol: 'Legal notice',
      seccions: [
        {
          titol: 'Website owner',
          paragrafs: [
            `In compliance with art. 10 of Spanish Law 34/2002 (LSSI-CE): owner, ${TITULAR}; contact email, ${EMAIL_CONTACTE}.`,
          ],
        },
        {
          titol: 'Purpose',
          paragrafs: [
            'This website is the owner\'s personal and professional portfolio. It showcases personal projects for demonstration purposes, with no commercial activity or sale of products or services.',
          ],
        },
        {
          titol: 'Intellectual property',
          paragrafs: [
            'The code, design and texts of this website are the owner\'s own work unless stated otherwise. Third-party trademarks, logos and images that may appear belong to their respective owners and are shown for illustrative purposes only, implying no relationship or sponsorship.',
            'If you own any content and believe it has been misused, write to the contact email and it will be removed.',
          ],
        },
      ],
    },
  },
};
