import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MdDialogRef } from '@angular/material';
import { WalletService } from '../../../../services/wallet.service';

@Component({
  selector: 'app-load-wallet',
  templateUrl: './load-wallet.component.html',
  styleUrls: ['./load-wallet.component.scss'],
})
export class LoadWalletComponent implements OnInit {

  form: FormGroup;
  seed: string;

  constructor(
    public dialogRef: MdDialogRef<LoadWalletComponent>,
    private walletService: WalletService,
  ) {}

  ngOnInit() {
    this.initForm();
  }

  closePopup() {
    this.dialogRef.close();
  }

  loadWallet() {
    this.walletService.create(this.form.value.label, this.form.value.seed);
    this.dialogRef.close();
  }

  private initForm() {
    this.form = new FormGroup({});
    this.form.addControl('label', new FormControl('', [Validators.required]));
    this.form.addControl('seed', new FormControl('', [Validators.required]));
  }
}
