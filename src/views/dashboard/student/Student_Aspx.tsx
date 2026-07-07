import { type FC, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import StudentApi from '@/infra/student/student_api';
import type { IStudentAssignmentListItem } from '@/infra/api/interfaces/IAssignment';
import type { IStudentSubject, IStudentSemester } from '@/infra/api/interfaces/IStudent';
import type { IDashboardOverview, IDashboardSubjectData } from '@/infra/api/interfaces/IDashboard';
import CSS from './dashboard/dashboard.styles';
import OverviewView from './dashboard/OverviewView';
import SubjectView from './dashboard/SubjectView';

const StudentAspx: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const maMon = searchParams.get('ma_mon');

  const [overview,    setOverview]    = useState<IDashboardOverview | null>(null);
  const [subjectData, setSubjectData] = useState<IDashboardSubjectData | null>(null);
  const [assignments, setAssignments] = useState<IStudentAssignmentListItem[]>([]);
  const [subjects,    setSubjects]    = useState<IStudentSubject[]>([]);
  const [semesters,   setSemesters]   = useState<IStudentSemester[]>([]);
  const [selectedHk,  setSelectedHk]  = useState<number | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [loadingSubjects, setLoadingSubjects]  = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setSubjectData(null);
      try {
        const semRes = await StudentApi.getSemesters();
        const semList = semRes.data.ds_hoc_ky;
        // Ưu tiên học kỳ trong URL, sau đó học kỳ hiện tại, cuối cùng fallback học kỳ đầu danh sách
        const hkFromUrl = Number(searchParams.get('hk')) || null;
        const initialHk = (hkFromUrl && semList.some(s => s.hoc_ky === hkFromUrl))
          ? hkFromUrl
          : semRes.data.hoc_ky_hien_tai ?? semList[0]?.hoc_ky ?? null;

        setSemesters(semList);
        setSelectedHk(initialHk);

        const fetches: Promise<unknown>[] = [
          StudentApi.getAssignments(),
          StudentApi.getDashboardOverview(),
          initialHk ? StudentApi.getSubjectsBySemester(initialHk) : Promise.resolve({ success: true, data: [] as IStudentSubject[] }),
        ];
        if (maMon) fetches.push(StudentApi.getDashboardSubject(maMon));

        const [asnRes, ovRes, subjectsRes, subjRes] = await Promise.all(fetches) as [
          Awaited<ReturnType<typeof StudentApi.getAssignments>>,
          Awaited<ReturnType<typeof StudentApi.getDashboardOverview>>,
          Awaited<ReturnType<typeof StudentApi.getSubjectsBySemester>>,
          Awaited<ReturnType<typeof StudentApi.getDashboardSubject>> | undefined,
        ];
        if (cancelled) return;
        setAssignments(asnRes.data ?? []);
        setOverview(ovRes.data);
        setSubjects(subjectsRes.data ?? []);
        if (maMon && subjRes) setSubjectData(subjRes.data);
      } catch {
        if (!cancelled) toast.error('Không thể tải dữ liệu dashboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run().catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maMon]);

  const handleSelectHk = (hk: number) => {
    setSelectedHk(hk);
    setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('hk', String(hk)); return next; }, { replace: true });
    setLoadingSubjects(true);
    StudentApi.getSubjectsBySemester(hk)
      .then(r => setSubjects(r.data ?? []))
      .catch(() => toast.error('Không thể tải danh sách môn học.'))
      .finally(() => setLoadingSubjects(false));
  };

  const currentSubject = subjects.find(s => s.ma_mon === maMon);
  const tenMon = currentSubject?.ten_mon ?? maMon ?? '';

  return (
    <div style={{ minHeight:'100%', background:'#f4f6fb' }}>
      <style>{CSS}</style>

      <div className="sd-page-content">
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, gap:10, color:'#64748b', fontSize:'0.82rem' }}>
            <Loader2 size={20} color="#2966EB" style={{ animation:'sd-spin 1s linear infinite' }} />
            Đang tải dữ liệu...
          </div>
        ) : maMon && subjectData ? (
          <SubjectView data={subjectData} assignments={assignments} maMon={maMon} tenMon={tenMon} lichThi={currentSubject?.lich_thi} />
        ) : !maMon && overview ? (
          <OverviewView
            data={overview}
            assignments={assignments}
            subjects={subjects}
            semesters={semesters}
            selectedHk={selectedHk}
            onSelectHk={handleSelectHk}
            loadingSubjects={loadingSubjects}
          />
        ) : (
          <div style={{ textAlign:'center', padding:'4rem 1rem', color:'#94a3b8', fontSize:'0.85rem' }}>
            Không có dữ liệu
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAspx;
