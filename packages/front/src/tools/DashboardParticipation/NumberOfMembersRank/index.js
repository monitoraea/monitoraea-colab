import { useQuery } from 'react-query';
import { Box} from '@mui/material';
import Card from '../../../commons/components/Card';

export default function Viz() {
  const chartId = 'VisualizationProducerPerOrganization';

  const { data } = useQuery(
    `adm/statistics/participation/rank_of_members`,
  );

  const { data: territories } = useQuery(`territory`);

  if (!territories || !data) {
    return null;
  }

  return (
    <Card
      id={chartId}
      sx={{ button: { color: 'inherit' } }}
      title="Ranking por quantidade de membros"
    >
      <>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <div className="vis-table">
            <table className="table-render">
              <tbody>
                {data.map(row => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td className="text-right">
                      <b>{row.total}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Box>
      </>
    </Card>
  );
}
