import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
describe('Error notification ownership',()=>{
 let http:HttpTestingController,client:HttpClient,show:jest.Mock,logout:jest.Mock,logged:boolean;
 beforeEach(()=>{logged=true;show=jest.fn();logout=jest.fn(()=>logged=false);TestBed.configureTestingModule({providers:[provideHttpClient(withInterceptors([authInterceptor])),provideHttpClientTesting(),{provide:Router,useValue:{navigate:jest.fn()}},{provide:AuthService,useValue:{isLoggedIn:()=>logged,logout}},{provide:ToastService,useValue:{show}}]});http=TestBed.inject(HttpTestingController);client=TestBed.inject(HttpClient);});
 afterEach(()=>http.verify());
 it('lets the operation handle a failed banner request without duplicate global toasts',()=>{let error:HttpErrorResponse|undefined;client.put('/api/v1/banners/1/toggle',{}).subscribe({error:e=>error=e});http.expectOne('/api/v1/banners/1/toggle').flush({message:'Forbidden'},{status:403,statusText:'Forbidden'});expect(error?.status).toBe(403);expect(show).not.toHaveBeenCalled();});
 it('warns only once when concurrent requests discover an expired session',()=>{for(const id of [1,2])client.get('/protected/'+id).subscribe({error:()=>{}});for(const id of [1,2])http.expectOne('/protected/'+id).flush({message:'Unauthorized'},{status:401,statusText:'Unauthorized'});expect(show).toHaveBeenCalledTimes(1);expect(logout).toHaveBeenCalledTimes(1);});
 it('preserves login error status for the login form',()=>{let error:HttpErrorResponse|undefined;client.post('/api/v1/auth/login',{}).subscribe({error:e=>error=e});http.expectOne('/api/v1/auth/login').flush({message:'Invalid password'},{status:401,statusText:'Unauthorized'});expect(error?.status).toBe(401);expect(show).not.toHaveBeenCalled();expect(logout).not.toHaveBeenCalled();});
});
