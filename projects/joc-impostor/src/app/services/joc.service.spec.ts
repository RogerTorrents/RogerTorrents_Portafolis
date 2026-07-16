import { TestBed } from '@angular/core/testing';

import { Joc } from './joc.service';

describe('Joc', () => {
  let service: Joc;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Joc);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
