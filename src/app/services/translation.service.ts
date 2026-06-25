import { Injectable, signal, computed } from '@angular/core';

export type Idioma = 'ca' | 'es' | 'en';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  readonly idioma = signal<Idioma>('ca');

  readonly etiquetaIdioma = computed(() => {
    const m: Record<Idioma, string> = { ca: 'CAT', es: 'ESP', en: 'ENG' };
    return m[this.idioma()];
  });

  private readonly dict: Record<string, Record<string, string>> = {
    ca: {
      unlock: 'Desbloquejar',
      lock_message: 'Prem qualsevol tecla o fes clic per desbloquejar',
      greeting: 'Benvingut',
      minimize: 'Minimitzar',
      maximize: 'Maximitzar',
      restore: 'Restaurar tamany',
      close: 'Tancar',
      volume: 'Volum',
      language: 'Idioma',
      search: 'Cercar',
      loading: 'Carregant...',
      open: 'Obrir',
      app_sobre_mi: 'Sobre mi',
      app_habilitats: 'Habilitats',
      app_contactar: 'Contactar',
      placeholder_sobre_mi: 'Aquí anirà tot el contingut de Sobre mi: qui soc, la meva trajectòria i experiència.',
      placeholder_habilitats: 'Aquí anirà tot el contingut d\'Habilitats: tecnologies, eines i competències.',
      placeholder_contactar: 'Aquí anirà tot el contingut de Contactar: formulari, xarxes socials i correu.',
      app_fons_depantalla: 'Fons de pantalla',
      voronoi_titol: 'Diagrama de Voronoi',
      voronoi_desc: 'Els diagrames de Voronoi divideixen un pla en regions basant-se en la distància a un conjunt de punts. Apareixen a la natura en la pell de les girafes, les ales de les libèl·lules, les fulles de les plantes o les bombolles de sabó.',
      voronoi_punts: 'Nombre de punts',
      voronoi_color: 'Color base',
      voronoi_previsualitzacio: 'Previsualització',
      voronoi_acceptar: 'Acceptar',
      voronoi_restaurar: 'Restaurar',
      months_0: 'Gener', months_1: 'Febrer', months_2: 'Març', months_3: 'Abril',
      months_4: 'Maig', months_5: 'Juny', months_6: 'Juliol', months_7: 'Agost',
      months_8: 'Setembre', months_9: 'Octubre', months_10: 'Novembre', months_11: 'Desembre',
      days_0: 'Dl', days_1: 'Dt', days_2: 'Dc', days_3: 'Dj', days_4: 'Dv', days_5: 'Ds', days_6: 'Dg',
    },
    es: {
      unlock: 'Desbloquear',
      lock_message: 'Pulsa cualquier tecla o haz clic para desbloquear',
      greeting: 'Bienvenido',
      minimize: 'Minimizar',
      maximize: 'Maximizar',
      restore: 'Restaurar tamaño',
      close: 'Cerrar',
      volume: 'Volumen',
      language: 'Idioma',
      search: 'Buscar',
      loading: 'Cargando...',
      open: 'Abrir',
      app_sobre_mi: 'Sobre mí',
      app_habilitats: 'Habilidades',
      app_contactar: 'Contactar',
      placeholder_sobre_mi: 'Aquí irá todo el contenido de Sobre mí: quién soy, mi trayectoria y experiencia.',
      placeholder_habilitats: 'Aquí irá todo el contenido de Habilidades: tecnologías, herramientas y competencias.',
      placeholder_contactar: 'Aquí irá todo el contenido de Contactar: formulario, redes sociales y correo.',
      app_fons_depantalla: 'Fondo de pantalla',
      voronoi_titol: 'Diagrama de Voronoi',
      voronoi_desc: 'Los diagramas de Voronoi dividen un plano en regiones basándose en la distancia a un conjunto de puntos. Aparecen en la naturaleza en la piel de las jirafas, las alas de las libélulas, las hojas de las plantas o las pompas de jabón.',
      voronoi_punts: 'Número de puntos',
      voronoi_color: 'Color base',
      voronoi_previsualitzacio: 'Previsualización',
      voronoi_acceptar: 'Aceptar',
      voronoi_restaurar: 'Restaurar',
      months_0: 'Enero', months_1: 'Febrero', months_2: 'Marzo', months_3: 'Abril',
      months_4: 'Mayo', months_5: 'Junio', months_6: 'Julio', months_7: 'Agosto',
      months_8: 'Septiembre', months_9: 'Octubre', months_10: 'Noviembre', months_11: 'Diciembre',
      days_0: 'Lu', days_1: 'Ma', days_2: 'Mi', days_3: 'Ju', days_4: 'Vi', days_5: 'Sá', days_6: 'Do',
    },
    en: {
      unlock: 'Unlock',
      lock_message: 'Press any key or click to unlock',
      greeting: 'Welcome',
      minimize: 'Minimize',
      maximize: 'Maximize',
      restore: 'Restore down',
      close: 'Close',
      volume: 'Volume',
      language: 'Language',
      search: 'Search',
      loading: 'Loading...',
      open: 'Open',
      app_sobre_mi: 'About me',
      app_habilitats: 'Skills',
      app_contactar: 'Contact',
      placeholder_sobre_mi: 'Here will go all the About me content: who I am, my career and experience.',
      placeholder_habilitats: 'Here will go all the Skills content: technologies, tools and competencies.',
      placeholder_contactar: 'Here will go all the Contact content: form, social networks and email.',
      app_fons_depantalla: 'Wallpaper',
      voronoi_titol: 'Voronoi Diagram',
      voronoi_desc: 'Voronoi diagrams divide a plane into regions based on the distance to a set of points. They appear in nature on giraffe skin, dragonfly wings, plant leaves or soap bubbles.',
      voronoi_punts: 'Number of points',
      voronoi_color: 'Base colour',
      voronoi_previsualitzacio: 'Preview',
      voronoi_acceptar: 'Apply',
      voronoi_restaurar: 'Reset',
      months_0: 'January', months_1: 'February', months_2: 'March', months_3: 'April',
      months_4: 'May', months_5: 'June', months_6: 'July', months_7: 'August',
      months_8: 'September', months_9: 'October', months_10: 'November', months_11: 'December',
      days_0: 'Mo', days_1: 'Tu', days_2: 'We', days_3: 'Th', days_4: 'Fr', days_5: 'Sa', days_6: 'Su',
    },
  };

  setLang(l: Idioma) {
    this.idioma.set(l);
  }

  getLang() {
    return this.idioma();
  }

  t(key: string): string {
    return this.dict[this.idioma()]?.[key] ?? key;
  }
}
