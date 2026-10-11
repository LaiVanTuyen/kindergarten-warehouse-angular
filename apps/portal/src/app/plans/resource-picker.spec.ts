import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { CollectionService, Resource, ResourceService } from '@kindergarten-warehouse/data-access';
import { ResourcePickerDialogComponent } from './resource-picker-dialog.component';

describe('Chọn học liệu cho kế hoạch', () => {
  it('does not attach an old search result while the new search is pending', () => {
    const first = new Subject<any>(), second = new Subject<any>();
    const get = jest.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
    TestBed.configureTestingModule({ providers: [
      { provide: ResourceService, useValue: { getPortalResources: get } },
      { provide: CollectionService, useValue: { listMine: () => of({content: []}) } },
    ] });
    const picker = TestBed.runInInjectionContext(() => new ResourcePickerDialogComponent());
    picker.search();
    first.next({result: {content: [{id: 'old'} as Resource]}});
    expect(picker.results()[0].id).toBe('old');
    picker.keyword = 'new'; picker.search();
    expect(picker.results()).toEqual([]);
    first.next({result: {content: [{id: 'stale'} as Resource]}});
    expect(picker.results()).toEqual([]);
    second.next({result: {content: [{id: 'new'} as Resource]}});
    expect(picker.results()[0].id).toBe('new');
    picker.openCollections();
    second.next({result: {content: [{id: 'late'} as Resource]}});
    expect(picker.results()).toEqual([]);
  });
});
