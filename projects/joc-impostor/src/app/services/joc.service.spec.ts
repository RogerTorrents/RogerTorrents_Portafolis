import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { JocService } from './joc.service';

describe('JocService', () => {
  let service: JocService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(JocService);
  });

  it('comença a la pantalla de configuració i sense errors', () => {
    expect(service.pantalla()).toBe(1);
    expect(service.errorApi()).toBeNull();
  });
});
