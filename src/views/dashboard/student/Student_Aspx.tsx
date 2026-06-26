import { type FC, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import StudentApi from '@/infra/student/student_api';
import type { IStudentAssignmentListItem } from '@/infra/api/interfaces/IAssignment';
import type { IStudentSubject } from '@/infra/api/interfaces/IStudent';
import type { IDashboardOverview, IDashboardSubjectData } from '@/infra/api/interfaces/IDashboard';
import CSS from './dashboard/dashboard.styles';
import OverviewView from './dashboard/OverviewView';
import SubjectView from './dashboard/SubjectView';

const StudentAspx: FC = () => {
  const [searchParams] = useSearchParams();
  const maMon = searchParams.get('ma_mon');

  const [overview,    setOverview]    = useState<IDashboardOverview | null>(null);
  const [subjectData, setSubjectData] = useState<IDashboardSubjectData | null>(null);
  const [assignments, setAssignments] = useState<IStudentAssignmentListItem[]>([]);
  const [subjects,    setSubjects]    = useState<IStudentSubject[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setSubjectData(null);
      try {
        const semRes = await StudentApi.getSemesters();
        const hk     = semRes.data.hoc_ky_hien_tai;

        const fetches: Promise<unknown>[] = [
          StudentApi.getAssignments(),
          StudentApi.getDashboardOverview(),
          StudentApi.getSubjectsBySemester(hk),
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
  }, [maMon]);

  const tenMon = subjects.find(s => s.ma_mon === maMon)?.ten_mon ?? maMon ?? '';

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
          <SubjectView data={subjectData} assignments={assignments} maMon={maMon} tenMon={tenMon} />
        ) : !maMon && overview ? (
          <OverviewView data={overview} assignments={assignments} subjects={subjects} />
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
