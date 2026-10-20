// Domini de producció: cada micro-app al seu subdomini de rogertorrents.com.
// Han de ser HTTPS: un Shell servit per HTTPS no pot carregar iframes HTTP.
export const environment = {
  produccio: true,
  appsUrls: {
    'sobre-mi': 'https://sobre-mi.rogertorrents.com',
    'joc-impostor': 'https://impostor.rogertorrents.com',
    geoexplorer: 'https://geoexplorer.rogertorrents.com',
    'mes-que-un-joc': 'https://mes-que-un-joc.rogertorrents.com',
    'som-hi': 'https://som-hi.rogertorrents.com',
    'juguem-al-truc': 'https://truc.rogertorrents.com',
    'altres-projectes': 'https://altres-projectes.rogertorrents.com',
  },
};
