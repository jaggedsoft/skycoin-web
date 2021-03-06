import { TestBed, fakeAsync } from '@angular/core/testing';
import 'rxjs/add/observable/of';
import { Observable } from 'rxjs/Observable';
import { TranslateService } from '@ngx-translate/core';

import { SpendingService } from './spending.service';
import { WalletService } from './wallet.service';
import { ApiService } from '../api.service';
import { CipherProvider } from '../cipher.provider';
import { CoinService } from '../coin.service';
import { MockCoinService, MockWalletService } from '../../utils/test-mocks';
import { createWallet, createAddress } from './wallet.service.spec';
import {
  Wallet,
  TransactionOutput,
  TransactionInput,
  Output,
  GetOutputsRequestOutput } from '../../app.datatypes';

describe('SpendingService', () => {
  let store = {};
  let spendingService: SpendingService;
  let walletService:  WalletService;
  let spyApiService:  jasmine.SpyObj<ApiService>;
  let spyTranslateService: jasmine.SpyObj<TranslateService>;
  let spyCipherProvider: jasmine.SpyObj<CipherProvider>;

  beforeEach(() => {
    spyOn(localStorage, 'setItem').and.callFake((key, value) => store[key] = value);
    spyOn(localStorage, 'getItem').and.callFake((key) => store[key]);

    TestBed.configureTestingModule({
      providers: [
        SpendingService,
        { provide: WalletService, useClass: MockWalletService },
        {
          provide: ApiService,
          useValue: jasmine.createSpyObj('ApiService', {
            'get': Observable.of([])
          })
        },
        {
          provide: CipherProvider,
          useValue: jasmine.createSpyObj('CipherProvider', ['generateAddress', 'prepareTransaction'])
        },
        {
          provide: TranslateService,
          useValue: jasmine.createSpyObj('TranslateService', ['instant'])
        },
        { provide: CoinService, useClass: MockCoinService }
      ]
    });

    spendingService = TestBed.get(SpendingService);
    walletService = TestBed.get(WalletService);
    spyApiService = TestBed.get(ApiService);
    spyCipherProvider = TestBed.get(CipherProvider);
    spyTranslateService = TestBed.get(TranslateService);
  });

  afterEach(() => {
    store = {};
  });

  it('should be created', () => {
    expect(spendingService).toBeTruthy();
  });

  describe('createTransaction', () => {
    it('should return a correct observable for two outputs', fakeAsync(() => {
      const address = 'address';
      const amount = 21;

      const addresses = [
        createAddress('address1', 'secretKey1'),
        createAddress('address2', 'secretKey2')
      ];

      const wallet: Wallet = Object.assign(createWallet(), { addresses: addresses });

      const outputs: Output[] = [
        createOutput('address1', 'hash1', 5, 10),
        createOutput('address2', 'hash2', 10, 20),
        createOutput('address1', 'hash1', 20, 50),
        createOutput('address2', 'hash2', 50, 0)
      ];

      const expectedTxInputs: TransactionInput[] = [
        { hash: 'hash1', secret: 'secretKey1', address: 'address1', calculated_hours: 50, coins: 20 },
        { hash: 'hash2', secret: 'secretKey2', address: 'address2', calculated_hours: 20, coins: 10 }
      ];

      const expectedTxOutputs: TransactionOutput[] = [
        {
          address: wallet.addresses[0].address,
          coins: 9,
          hours: 18
        },
        {
          address: address,
          coins: 21,
          hours: 17
        }
      ];

      spyApiService.get.and.returnValue(Observable.of({ head_outputs: outputs }));
      spyCipherProvider.prepareTransaction.and.returnValue(Observable.of('preparedTransaction'));

      spendingService.createTransaction(wallet, address, amount)
        .subscribe((result: any) => {
          expect(result).toEqual({
            inputs: expectedTxInputs,
            outputs: expectedTxOutputs,
            hoursSent: 17,
            hoursBurned: 35,
            encoded: 'preparedTransaction'
          });
        });
    }));

    it('should be return a correct observable for one output', fakeAsync(() => {
      const address = 'address';
      const amount = 1;

      const addresses = [
        createAddress('address1', 'secretKey1')
      ];

      const wallet: Wallet = Object.assign(createWallet(), { addresses: addresses });

      const outputs: Output[] = [
        createOutput('address1', 'hash1', 1, 10)
      ];

      const expectedTxInputs: TransactionInput[] = [
        { hash: 'hash1', secret: 'secretKey1', address: 'address1', calculated_hours: 10, coins: 1 }
      ];

      const expectedTxOutputs: TransactionOutput[] = [
        {
          address: address,
          coins: 1,
          hours: 5
        }
      ];

      spyApiService.get.and.returnValue(Observable.of({ head_outputs: outputs }));
      spyCipherProvider.prepareTransaction.and.returnValue(Observable.of('preparedTransaction'));

      spendingService.createTransaction(wallet, address, amount)
        .subscribe((result: any) => {
          expect(result).toEqual({
            inputs: expectedTxInputs,
            outputs: expectedTxOutputs,
            hoursSent: 5,
            hoursBurned: 5,
            encoded: 'preparedTransaction'
          });
        });
    }));

    it('should reject if there are not enough hours', () => {
      const address = 'address';
      const amount = 2;

      const addresses = [
        createAddress('address1', 'secretKey1'),
        createAddress('address2', 'secretKey2')
      ];

      const wallet: Wallet = Object.assign(createWallet(), { addresses: addresses });

      const outputs: Output[] = [
        createOutput('address1', 'hash1', 1, 24),
        createOutput('address2', 'hash2', 1, 0)
      ];

      spyApiService.get.and.returnValue(Observable.of({ head_outputs: outputs }));
      spyTranslateService.instant.and.callFake((param) => {
        if (param === 'service.wallet.not-enough-hours1') {
          return 'Not enough available';
        }

        if (param === 'service.wallet.not-enough-hours2') {
          return 'to perform transaction!';
        }
      });

      spendingService.createTransaction(wallet, address, amount)
        .subscribe(
          () => fail('should be rejected'),
          (error) => expect(error.message).toBe('Not enough available Test Hours to perform transaction!')
        );
    });
  });

  describe('outputsWithWallets', () => {
    it('should return outputs by wallet', fakeAsync(() => {
      const walletAddress1 = 'address 1';
      const walletAddress2 = 'address 2';
      const wallet1: Wallet = Object.assign(createWallet(), { addresses: [ createAddress(walletAddress1), createAddress(walletAddress2) ] });
      const walletAddress3 = 'address 3';
      const wallet2: Wallet = Object.assign(createWallet(), { addresses: [ createAddress(walletAddress3) ] });

      spyOnProperty(walletService, 'currentWallets', 'get').and.returnValue( Observable.of([wallet1, wallet2]) );

      const output1 = createRequestOutput('hash3', walletAddress3, '33', 3 );
      const output2 = createRequestOutput('hash2', walletAddress2, '22', 2 );
      const output3 = createRequestOutput('hash1', walletAddress1, '11', 1 );

      spyApiService.get.and.returnValue(Observable.of({ head_outputs: [ output1, output2, output3 ] }));

      const expectedWallet1 = Object.assign(createWallet(), { addresses: [ createAddress(walletAddress1), createAddress(walletAddress2) ] });
      const expectedWallet2 = Object.assign(createWallet(), { addresses: [ createAddress(walletAddress3) ] });

      expectedWallet1.addresses[0].outputs = [ output3 ];
      expectedWallet1.addresses[1].outputs = [ output2 ];
      expectedWallet2.addresses[0].outputs = [ output1 ];

      const expectedOutputs = [ expectedWallet1, expectedWallet2 ];

      spendingService.outputsWithWallets()
        .subscribe((walletOutputs: any[]) => {
          expect(walletOutputs).toEqual(expectedOutputs);
        });
    }));
  });
});

function createOutput(address: string, hash: string, coins = 10, calculated_hours = 100): Output {
  return {
    address: address,
    coins: coins,
    hash: hash,
    calculated_hours: calculated_hours
  };
}

function createRequestOutput(hash: string, address: string, coins = '10', calculated_hours = 100): GetOutputsRequestOutput {
  return {
    hash: hash,
    src_tx: 'src_tx: string',
    address: address,
    coins: coins,
    calculated_hours: calculated_hours
  };
}
