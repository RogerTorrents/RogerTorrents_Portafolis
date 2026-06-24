import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private lang: 'ca' | 'es' | 'en' = 'ca';

  private readonly dict: Record<string, Record<string, string>> = {
    ca: {
      unlock: 'Desbloquejar',
      lock_message: 'Prem qualsevol tecla o fes clic per desbloquejar',
      greeting: 'Benvingut',
    },
    es: {
      unlock: 'Desbloquear',
      lock_message: 'Pulsa cualquier tecla o haz clic para desbloquear',
      greeting: 'Bienvenido',
    },
    en: {
      unlock: 'Unlock',
      lock_message: 'Press any key or click to unlock',
      greeting: 'Welcome',
    },
  };

  setLang(l: 'ca' | 'es' | 'en') {
    this.lang = l;
  }

  getLang() {
    return this.lang;
  }

  t(key: string) {
    return this.dict[this.lang]?.[key] ?? key;
  }
}
