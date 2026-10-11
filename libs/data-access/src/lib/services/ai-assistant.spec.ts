import { AiPlanDraft, aiDraftToPlanRequest, applyAiAdjustment } from './ai-assistant.service';
import { LessonPlanDetail } from './lesson-plan.service';

function current(): LessonPlanDetail {
  return {
    plan: {
      id: 9, title: 'Màu sắc', status: 'SHARED', template: false, ownerId: 1, ownerName: 'Cô An', isOwner: true,
      stepCount: 2, version: 4, createdAt: '', updatedAt: '', durationMinutes: 20, objectives: 'Nhận biết màu',
      taughtOn: '2026-10-01',
    },
    reflection: 'Ghi nhận riêng',
    preparation: 'Giấy',
    stepMinutesTotal: 20,
    steps: [
      { id: 1, title: 'Khởi động', durationMinutes: 5, description: 'Hát', source: 'TEACHER',
        resources: [{ resourceId: 'gone', available: false, resource: null }] },
      { id: 2, title: 'Khám phá', durationMinutes: 15, description: 'Xem tranh', source: 'TEACHER', resources: [] },
    ],
  };
}

const adjusted: AiPlanDraft = {
  title: 'Màu sắc',
  durationMinutes: 15,
  objectives: 'Nhận biết màu',
  preparation: 'Giấy',
  adaptations: 'Không có máy chiếu: dùng tranh in',
  notes: 'Rút còn 15 phút',
  remainingToday: 10,
  steps: [
    { title: 'Khởi động', durationMinutes: 5, description: 'Hát', resourceIds: ['gone'], resources: [] },
    { title: 'Khám phá', durationMinutes: 10, description: 'Xem tranh in', resourceIds: [], resources: [] },
  ],
};

describe('AI assistant helpers', () => {
  it('chỉ bước bị thay đổi mới thành "AI đề xuất"; bước giữ nguyên giữ nguồn và tham chiếu cũ', () => {
    const result = applyAiAdjustment(current(), adjusted);
    expect(result.steps.map((s) => s.source)).toEqual(['TEACHER', 'AI_SUGGESTED']);
    expect(result.steps[0].resources).toEqual([{ resourceId: 'gone', available: false, resource: null }]);
    expect(result.adaptations).toBe('Không có máy chiếu: dùng tranh in');
  });

  it('không bao giờ đụng tới version, chia sẻ, ghi nhận và ngày dạy', () => {
    const result = applyAiAdjustment(current(), adjusted);
    expect(result.plan.version).toBe(4);
    expect(result.plan.status).toBe('SHARED');
    expect(result.reflection).toBe('Ghi nhận riêng');
    expect(result.plan.taughtOn).toBe('2026-10-01');
  });

  it('kế hoạch tạo từ bản nháp AI là DRAFT và mọi bước là AI_SUGGESTED', () => {
    const req = aiDraftToPlanRequest(adjusted, { ageGroupId: 2, classSize: 25 });
    expect(req.status).toBe('DRAFT');
    expect(req.steps!.every((s) => s.source === 'AI_SUGGESTED')).toBe(true);
    expect(req.ageGroupId).toBe(2);
    expect(req.classSize).toBe(25);
  });
});
