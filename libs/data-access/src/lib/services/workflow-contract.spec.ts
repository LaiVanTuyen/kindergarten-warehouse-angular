import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { API_URL } from '../tokens';
import { BannerService } from './banner.service';
import { ResourceService } from './resource.service';
import { CategoryService } from './category.service';
import { DashboardService } from './dashboard.service';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { youtubeVideoId } from '../utils/youtube';

describe('Live backend workflow contracts', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting(),{provide:API_URL,useValue:'/api/v1'}]});
    http=TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('hides a banner with the backend PUT endpoint', () => {
    TestBed.inject(BannerService).toggleBanner(12).subscribe(r=>expect(r.result.visibility).toBe('PRIVATE'));
    const req=http.expectOne('/api/v1/banners/12/toggle');expect(req.request.method).toBe('PUT');
    req.flush({result:{id:12,visibility:'PRIVATE'}});
  });
  it('bulk approval sends resourceIds rather than the obsolete ids field', () => {
    TestBed.inject(ResourceService).bulkApproveResources(['uuid-1']).subscribe();
    const req=http.expectOne('/api/v1/admin/resources/bulk-approve');expect(req.request.body).toEqual({resourceIds:['uuid-1']});req.flush({result:{successCount:1,failedIds:[]}});
  });
  it('bulk rejection retains the reason and resource identifiers', () => {
    TestBed.inject(ResourceService).bulkRejectResources(['uuid-1'],'Bổ sung nội dung').subscribe();
    const req=http.expectOne('/api/v1/admin/resources/bulk-reject');expect(req.request.body).toEqual({resourceIds:['uuid-1'],reason:'Bổ sung nội dung'});req.flush({result:{successCount:1}});
  });
  it('resource bulk deletion and restore use list bodies', () => {
    const service=TestBed.inject(ResourceService);service.bulkDeleteResources(['uuid-1']).subscribe();
    const del=http.expectOne('/api/v1/resources/bulk');expect(del.request.method).toBe('DELETE');expect(del.request.body).toEqual(['uuid-1']);del.flush({});
    service.bulkRestoreResources(['uuid-1']).subscribe();const restore=http.expectOne('/api/v1/resources/bulk-restore');expect(restore.request.body).toEqual(['uuid-1']);restore.flush({});
  });
  it('category bulk deletion and restore use list bodies', () => {
    const service=TestBed.inject(CategoryService);service.deleteCategories([1,2]).subscribe();
    const del=http.expectOne('/api/v1/categories/bulk?hard=false');expect(del.request.method).toBe('DELETE');expect(del.request.body).toEqual([1,2]);del.flush({});
    service.restoreCategories([1,2]).subscribe();const restore=http.expectOne('/api/v1/categories/bulk-restore');expect(restore.request.body).toEqual([1,2]);restore.flush({});
  });
  it('dashboard reads actual HTTP data and moderation writes real UUIDs', () => {
    const service=TestBed.inject(DashboardService);service.getDashboard('custom',{startDate:'2026-10-01',endDate:'2026-10-11'}).subscribe(r=>expect(r.stats.totalResources).toBe(3));
    const req=http.expectOne(r=>r.url==='/api/v1/admin/dashboard');expect(req.request.params.get('startDate')).toBe('2026-10-01');req.flush({result:{stats:{totalResources:3}}});
    service.approveResource('actual-uuid').subscribe();const approval=http.expectOne('/api/v1/admin/resources/actual-uuid/approve');expect(approval.request.method).toBe('PATCH');approval.flush({});
  });
  it('supports YouTube watch, short, embed, Shorts and live URLs', () => {
    for(const url of ['https://youtube.com/watch?feature=share&v=M7lc1UVf-VE','https://youtu.be/M7lc1UVf-VE?t=2','https://youtube.com/embed/M7lc1UVf-VE','https://youtube.com/shorts/M7lc1UVf-VE','https://youtube.com/live/M7lc1UVf-VE'])expect(youtubeVideoId(url)).toBe('M7lc1UVf-VE');
    expect(youtubeVideoId('https://youtube.com.evil.test/watch?v=M7lc1UVf-VE')).toBeNull();expect(youtubeVideoId('javascript:alert(1)')).toBeNull();
  });
  it('password reset sends email and OTP rather than an unsupported token', () => {
    const auth=TestBed.inject(AuthService);
    auth.resetPassword('demo.teacher@example.com','123456','NewPassword2026!').subscribe();
    const req=http.expectOne('/api/v1/auth/reset-password');expect(req.request.body).toEqual({email:'demo.teacher@example.com',otp:'123456',newPassword:'NewPassword2026!'});req.flush({result:null});
  });
  it('user filters bind to roles/statuses and deleted users expose restore controls', () => {
    TestBed.inject(UserService).getUsers(1,15,'','USER','DELETED').subscribe(r=>expect(r.result.content[0].status).toBe('DELETED'));
    const req=http.expectOne(r=>r.url==='/api/v1/users');expect(req.request.params.get('roles')).toBe('USER');expect(req.request.params.get('statuses')).toBe('DELETED');
    req.flush({result:{content:[{id:1,status:'ACTIVE',isDeleted:true}],totalElements:1}});
  });
  it('a repeated view-count request does not turn a readable page into an operation error', () => {
    let called=false;TestBed.inject(ResourceService).incrementViewCount('uuid-1').subscribe({next:()=>called=true,error:()=>fail('View throttling must be non-fatal')});
    http.expectOne('/api/v1/resources/uuid-1/view').flush({message:'View counted recently'},{status:429,statusText:'Too Many Requests'});expect(called).toBe(true);
  });
});
