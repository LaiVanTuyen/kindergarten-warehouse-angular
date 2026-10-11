import { RelativeTimePipe } from './relative-time.pipe';
describe('UTC dates from the backend',()=>{
 afterEach(()=>jest.restoreAllMocks());
 it('does not turn a one-minute-old UTC timestamp into seven hours',()=>{jest.spyOn(Date,'now').mockReturnValue(Date.parse('2026-10-11T08:45:00Z'));expect(new RelativeTimePipe().transform('2026-10-11T08:44:00')).toBe('1 phút trước');});
 it('preserves explicit offsets',()=>{jest.spyOn(Date,'now').mockReturnValue(Date.parse('2026-10-11T08:45:00Z'));expect(new RelativeTimePipe().transform('2026-10-11T15:44:00+07:00')).toBe('1 phút trước');});
});
