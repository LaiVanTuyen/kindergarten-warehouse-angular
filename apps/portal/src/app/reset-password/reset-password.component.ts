import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService, passwordValidator, ToastService, extractErrorMessage } from '@kindergarten-warehouse/data-access';
@Component({selector:'app-reset-password',standalone:true,imports:[ReactiveFormsModule,RouterLink],template:`
<main class="min-h-screen pt-28 p-6 bg-surface-2"><section class="max-w-md mx-auto p-8 rounded-2xl border border-line bg-surface">
<h1 class="text-2xl font-bold mb-4">Đặt lại mật khẩu</h1><p class="text-sm text-ink-soft mb-4">Nhập email, mã OTP trong email và mật khẩu mới.</p>
<form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
<div><label for="reset-email">Email</label><input id="reset-email" type="email" formControlName="email" autocomplete="email" class="w-full border rounded-xl p-3" /></div>
<div><label for="reset-otp">Mã OTP</label><input id="reset-otp" inputmode="numeric" formControlName="otp" autocomplete="one-time-code" maxlength="8" class="w-full border rounded-xl p-3" /></div>
<div><label for="reset-password">Mật khẩu mới</label><input id="reset-password" type="password" formControlName="newPassword" autocomplete="new-password" class="w-full border rounded-xl p-3" /><p class="text-sm text-ink-soft">Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số.</p></div>
<div><label for="reset-confirm">Nhập lại mật khẩu</label><input id="reset-confirm" type="password" formControlName="confirmPassword" autocomplete="new-password" class="w-full border rounded-xl p-3" /></div>
@if(error()){<p role="alert" class="text-danger">{{error()}}</p>}
<button type="submit" [disabled]="busy()" class="w-full rounded-xl p-3 bg-primary text-ink-onbrand">Lưu mật khẩu mới</button>
</form><a routerLink="/forgot-password" class="block mt-4 text-primary underline">Gửi lại mã OTP</a></section></main>`})
export class ResetPasswordComponent {
 private readonly auth=inject(AuthService);private readonly router=inject(Router);private readonly toast=inject(ToastService);private readonly route=inject(ActivatedRoute);
 readonly busy=signal(false);readonly error=signal('');
 readonly form=inject(FormBuilder).nonNullable.group({email:[this.route.snapshot.queryParamMap.get('email')??'',[Validators.required,Validators.email]],otp:['',[Validators.required,Validators.pattern(/^\d{6,8}$/)]],newPassword:['',[Validators.required,passwordValidator(),Validators.maxLength(100)]],confirmPassword:['',Validators.required]});
 submit(){if(this.busy())return;const v=this.form.getRawValue();if(this.form.invalid){this.form.markAllAsTouched();this.error.set('Kiểm tra email, mã OTP và mật khẩu mới.');return;}if(v.newPassword!==v.confirmPassword){this.error.set('Hai mật khẩu chưa khớp.');return;}this.busy.set(true);this.error.set('');this.auth.resetPassword(v.email,v.otp,v.newPassword).pipe(finalize(()=>this.busy.set(false))).subscribe({next:()=>{this.toast.show('Đã đặt lại mật khẩu. Vui lòng đăng nhập.','success');this.router.navigate(['/login']);},error:e=>this.error.set(extractErrorMessage(e,'Không đặt lại được mật khẩu.'))});}
}
