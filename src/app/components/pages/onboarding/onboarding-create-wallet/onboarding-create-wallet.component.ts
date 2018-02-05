import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MdDialog, MdDialogConfig } from '@angular/material';
import { Router } from '@angular/router';
import * as Bip39 from 'bip39';
import { WalletService } from '../../../../services/wallet.service';
import { DoubleButtonActive } from '../../../layout/double-button/double-button.component';
import { OnboardingDisclaimerComponent } from './onboarding-disclaimer/onboarding-disclaimer.component';
import { OnboardingSafeguardComponent } from './onboarding-safeguard/onboarding-safeguard.component';

@Component({
  selector: 'app-onboarding-create-wallet',
  templateUrl: './onboarding-create-wallet.component.html',
  styleUrls: ['./onboarding-create-wallet.component.scss'],
})
export class OnboardingCreateWalletComponent implements OnInit, AfterViewInit {
  showNewForm = true;
  form: FormGroup;
  doubleButtonActive = DoubleButtonActive.LeftButton;

  constructor(
    private dialog: MdDialog,
    public walletService: WalletService,
    private router: Router,
    private formBuilder: FormBuilder,
  ) { }

  ngOnInit() {
    this.initForm();
  }

  ngAfterViewInit() {
    this.existWallets();
  }

  existWallets() {
    this.walletService.all().subscribe(wallets => {
      if (wallets.length === 0) {
        this.showDisclaimer();
      }
    });
  }

  initForm() {
    this.form = this.formBuilder.group({
      label: new FormControl('', Validators.compose([
          Validators.required, Validators.minLength(2),
        ])),
      seed: new FormControl('', Validators.compose([
          Validators.required, Validators.minLength(2),
        ])),
      confirm_seed: new FormControl('',
        this.showNewForm ?
          Validators.compose([
            Validators.required,
            Validators.minLength(2),
            this.validateAreEqual.bind(this),
          ])
          : Validators.compose([]),
      )});
    if (this.showNewForm) {
      this.generateSeed();
    }

    this.form.controls.seed.valueChanges.subscribe(() => {
      this.form.controls.confirm_seed.updateValueAndValidity();
    });
  }

  changeForm(newState) {
    if (newState === DoubleButtonActive.RightButton) {
      this.showNewForm = false;
    } else {
      this.showNewForm = true;
    }
    this.initForm();
  }

  showDisclaimer() {
    const config = new MdDialogConfig();
    config.width = '450px';
    config.disableClose = true;
    this.dialog.open(OnboardingDisclaimerComponent, config);
  }

  showSafe() {
    const config = new MdDialogConfig();
    config.width = '450px';
    config.disableClose = true;
    this.dialog.open(OnboardingSafeguardComponent, config).afterClosed().subscribe(result => {
      if (result) {
        this.skip();
      }
    });
  }

  createWallet() {
    this.walletService.create(this.form.value.label, this.form.value.seed);
    this.showSafe();
  }

  loadWallet() {
    this.walletService.create(this.form.value.label, this.form.value.seed);
    this.skip();
  }

  skip() {
    this.router.navigate(['/wallets']);
  }

  generateSeed() {
    this.form.controls.seed.setValue(Bip39.generateMnemonic());
  }

  private validateAreEqual(fieldControl: FormControl) {
    if (this.form && this.form.controls.seed) {
      return fieldControl.value === this.form.controls.seed.value ? null : { NotEqual: true };
    }
  }

}
