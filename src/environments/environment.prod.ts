// Placeholder fins que cada micro-app tingui el seu domini de producció desplegat.
// Han de ser HTTPS: un Shell servit per HTTPS no pot carregar iframes HTTP.
export const environment = {
  produccio: true,
  appsUrls: {
    'sobre-mi': 'https://sobre-mi.rogertorrents.dev',
    habilitats: 'https://habilitats.rogertorrents.dev',
    contactar: 'https://contactar.rogertorrents.dev',
    'joc-impostor': 'https://impostor.rogertorrents.dev',
    geoexplorer: 'https://geoexplorer.rogertorrents.dev',
    'mes-que-un-joc': 'https://mes-que-un-joc.rogertorrents.dev',
    'som-hi': 'https://som-hi.rogertorrents.dev',
    'juguem-al-truc': 'https://truc.rogertorrents.dev',
    'altres-projectes': 'https://altres-projectes.rogertorrents.dev',
  },
};
