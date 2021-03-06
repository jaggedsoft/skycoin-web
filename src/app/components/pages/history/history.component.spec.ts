import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialogModule, MatDialog } from '@angular/material';

import { HistoryComponent } from './history.component';
import { HistoryService } from '../../../services/wallet/history.service';
import { PriceService } from '../../../services/price.service';
import { CoinService } from '../../../services/coin.service';
import { MockTranslatePipe, MockPriceService, MockCoinService, MockHistoryService } from '../../../utils/test-mocks';

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HistoryComponent, MockTranslatePipe ],
      imports: [ MatDialogModule ],
      providers: [
        MatDialog,
        { provide: HistoryService, useClass: MockHistoryService },
        { provide: PriceService, useClass: MockPriceService },
        { provide: CoinService, useClass: MockCoinService }
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
