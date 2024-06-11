import Card from '../../../commons/components/Card';

export default function Viz({ type }) {
    return <Card id="VisualizationProdPerYear" title="Erro" elevation={1}>
        <div className="vis-chart" id="prod">
            Tipo de gráfico desconhecido ({ type })!
        </div>
    </Card>
}