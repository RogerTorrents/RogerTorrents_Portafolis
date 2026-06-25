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
