import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { API_PATHS } from '@/routes/paths';

type RepeatedComplaint = {
  staffNo: string;
  userName: string;
  mainIssue?: string;
  relatedIssue?: string;
  subRelatedIssue?: string;
  repeatCount: number;
};


const RepeatedComplaints = () => {
  const [repeated, setRepeated] = useState<RepeatedComplaint[]>([]);

  useEffect(() => {
    const fetchRepeated = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_PATHS.admindashboard.getRepeatedComplaints, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          // ✅ Filter out any 'Others' from any issue level
          const filtered = data.repeated.filter((item: RepeatedComplaint) => {
            const isOthers = (value?: string) =>
              !value || value.trim().toLowerCase() === 'others';
            return !(isOthers(item.mainIssue) || isOthers(item.relatedIssue) || isOthers(item.subRelatedIssue));
          });

          setRepeated(filtered);
        } else {
          console.error('Failed to fetch repeated complaints');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchRepeated();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Repeated Complaints</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
  <TableRow>
    <TableHead>#</TableHead>
    <TableHead>Staff No</TableHead>
    <TableHead>User Name</TableHead>
    <TableHead>Main Issue</TableHead>
    <TableHead>Related Issue</TableHead>
    <TableHead>Sub-Related Issue</TableHead>
    <TableHead>Times Reported</TableHead>
  </TableRow>
</TableHeader>
<TableBody>
  {repeated.map((item, index) => (
    <TableRow key={index}>
      <TableCell>{index + 1}</TableCell>
      <TableCell>{item.staffNo}</TableCell>
      <TableCell>{item.userName}</TableCell>
      <TableCell>{item.mainIssue || '—'}</TableCell>
      <TableCell>{item.relatedIssue || '—'}</TableCell>
      <TableCell>{item.subRelatedIssue || '—'}</TableCell>
      <TableCell className="font-bold text-red-600">{item.repeatCount}</TableCell>
    </TableRow>
  ))}
</TableBody>

          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default RepeatedComplaints;
