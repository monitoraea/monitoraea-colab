import { useEffect, useState, createRef } from 'react';
import { Map, TileLayer, WMSTileLayer/* , Popup */, ZoomControl } from 'react-leaflet';
import makeAnimated from 'react-select/animated';
/* import ReactPaginate from 'react-paginate'; */

import L from 'leaflet';

import { Link } from 'react-router-dom';

import axios from 'axios';
import { useQuery } from 'react-query';

import {
    reactSelectClassNamePrefix,
    StyledAsyncReactSelect,
    StyledReactSelect,
} from '../../components/StyledReactSelect';

import ToggleLeft from '../../components/icons/toggle-left.svg?react';
import ToggleRight from '../../components/icons/toggle-right.svg?react';

import Next from '../../components/icons/chevron-right.svg?react';
import Previous from '../../components/icons/chevron-left.svg?react';

import GoProject from '../../components/icons/log-in.svg?react';
import GoMap from '../../components/icons/map.svg?react';

import Chart from "react-apexcharts";

import styles from './styles.module.scss';

const animatedComponents = makeAnimated();
const mapRef = createRef();
const position = [-15.559793, -62.58506];
const zoom = 5;

const selectDefaults = {
    placeholder: 'Selecione...',
    noOptionsMessage: () => 'Nenhuma opção encontrada!',
    loadingMessage: () => 'Carregando...',
};

function prepareFilters(filters) {
    let preparedFilters = '';

    for (let filter in filters) {
        if (filters[filter]) preparedFilters = `${preparedFilters}&f_${filter}=${filters[filter]}`;
    }

    return preparedFilters;
}

async function getUFs(filters) {
    const { data } = await axios.get(`${import.meta.env.VITE_SERVER}project/ufs?none=1${prepareFilters(filters)}`);

    return data;
}

async function getClickedFeatureId(_map, latlng) {
    const _url = import.meta.env.VITE_GEOSERVER_URL;

    // Construct a GetFeatureInfo request URL given a point
    var point = _map.latLngToContainerPoint(latlng, _map.getZoom()),
        size = _map.getSize(),
        params = {
            request: 'GetFeatureInfo',
            service: 'WMS',
            srs: 'EPSG:4326',
            transparent: true,
            version: '1.1.1',
            format: 'image/png',
            bbox: _map.getBounds().toBBoxString(),
            height: size.y,
            width: size.x,
            layers: 'pppzcm:proj_atuacao',
            query_layers: 'pppzcm:proj_atuacao',
            info_format: 'application/json',
            x: Math.round(point.x),
            y: Math.round(point.y),
            feature_count: 20,
        };

    const getFeatureInfoURL = _url + L.Util.getParamString(params, _url, true);

    /* console.log(getFeatureInfoURL) */

    return await new Promise((resolve, reject) =>
        fetch(getFeatureInfoURL)
            .then(response => response.json())
            .then(data => {
                const err = typeof data === 'object' ? null : data;
                if (err) reject(err);
                else if (!data.features.length) resolve(null);
                else {
                    const [table] = data.features[0].id.split('.');
                    const ids = data.features.map(f => f.properties.project_id);

                    resolve({
                        table,
                        ids: [...new Set(ids)], // remove duplicates,
                    });
                }
            }),
    );
}

export default function MapZCM() {
    const [projects, _projects] = useState(null);
    const [projects_ids, _projects_ids] = useState(null);

    const [modalidades, _modalidades] = useState(null);
    const [linhas_acao, _linhas_acao] = useState(null);
    const [regioes, _regioes] = useState(null);
    const [ufs, _ufs] = useState(null);
    const [total, _total] = useState(null);
    const [modalidade_data, _modalidade_data] = useState(null);

    const [pag, _pag] = useState(null);
    const [currentPage, _currentPage] = useState(1);

    const [toggle, _toggle] = useState('map');
    const [chooserDisabled, _chooserDisabled] = useState(true);

    /* const [loading, _loading] = useState(false); */

    const [filters, _filters] = useState({});
    const [fields, _fields] = useState({
        modalidades: null,
        linhas_acao: null,
        regioes: null,
        ufs: null,
        municipios: null,
        id: null,
    });
    const [isFiltered, _isFiltered] = useState(false);

    const [showList, _showList] = useState(false);

    // const [showPop, _showPop] = useState(null);
    const [projectsToView, _projectsToView] = useState([]);
    const [showProjectsToView, _showProjectsToView] = useState(false);

    const [bbox, _bbox] = useState(false);

    const { data } = useQuery(['projects-total'], {
        queryFn: async () => (await axios.get(`${import.meta.env.VITE_SERVER}project/total`)).data,
        staleTime: 3600000,
    });

    useEffect(() => {
        getOptions();
    }, []);

    useEffect(() => {
        let isFiltered = false;
        for (let f of Object.values(filters)) {
            if (!!f) {
                isFiltered = true;
                break;
            }
        }
        _isFiltered(isFiltered)
    }, [filters])

    useEffect(() => {
        async function fetchData(page = 1) {
            if (Object.keys(filters).filter(k => !!filters[k]).length === 0) {
                _showList(false);
                return;
            } else _showList(true);

            /* _loading(true); */
            const {
                data: { projects: p, pages, hasPrevious, hasNext, currentPage, total, modalidades },
            } = await axios.get(`${import.meta.env.VITE_SERVER}project/?limit=6&page=${page}${prepareFilters(filters)}`);
            /* _loading(false); */

            _projects(p);
            _pag({ pages, hasPrevious, hasNext });
            _currentPage(currentPage);
            _total(total);
            _modalidade_data(modalidades);
        }

        fetchData(currentPage, filters);
    }, [currentPage, filters]);

    useEffect(() => {
        _currentPage(1);
        //_showPop(null);

        async function fetchGeoData() {
            if (Object.keys(filters).filter(k => !!filters[k]).length === 0) {
                _projects_ids(null);
                return;
            }

            const { data } = await axios.get(`${import.meta.env.VITE_SERVER}project/geo/?${prepareFilters(filters)}`);

            _projects_ids(data);
        }

        /* reset zoom and position */
        mapRef && mapRef.current && mapRef.current.leafletElement.setView(position, zoom);
        fetchGeoData(filters);
    }, [filters]);

    useEffect(() => {
        async function fetchUFs() {
            _ufs(await getUFs(filters));
        }

        fetchUFs();
    }, [filters]);

    /* useEffect(() => {
        if (!clickedPosition) _showPop(null);
        else _showPop(0);
    }, [clickedPosition]); */

    useEffect(() => {
        if (!bbox) return;

        const bounds = [
            [bbox.y1, bbox.x1],
            [bbox.y2, bbox.x2],
        ];
        //console.log('focus on', bounds);
        mapRef && mapRef.current && mapRef.current.leafletElement.fitBounds(bounds);
    }, [bbox]);

    useEffect(() => {
        _chooserDisabled(!projects?.length);
    }, [projects]);

    const getOptions = async () => {
        const {
            data: { modalidades, linhas_acao, regioes },
        } = await axios.get(`${import.meta.env.VITE_SERVER}project/options`);

        _modalidades(modalidades);
        _linhas_acao(linhas_acao);
        _regioes(regioes);
    };

    const onFilterChange = (type, selectedOption) => {
        _currentPage(1);

        let newFilters;
        let newFields = { ...fields, [type]: selectedOption, id: null };

        if (selectedOption) {
            newFilters = {
                ...filters,
                [type]: selectedOption.map(s => s.value).join(','),
                id: null,
            };
        } else {
            newFilters = { ...filters, [type]: null, id: null };
        }

        if (type === 'regioes') {
            newFields.ufs = null;
            newFilters.ufs = null;
        }
        if (['regioes', 'ufs'].includes(type)) {
            newFields.municipios = null;
            newFilters.municipios = null;
        }

        _fields(newFields);
        _filters(newFilters);
    };

    const onFilterNameChange = selectedOption => {
        _fields({ ...fields, id: selectedOption });

        if (selectedOption) {
            _filters({ ...filters, id: selectedOption.value });
        } else {
            _filters({ ...filters, id: null });
        }
    };

    const onFilterMunicipioChange = selectedOption => {
        _fields({ ...fields, municipios: selectedOption });

        if (selectedOption) {
            const municipios = selectedOption.map(s => s.value);
            _filters({ ...filters, municipios });
        } else {
            _filters({ ...filters, municipios: null });
        }
    };

    const onFilterInstNameChange = selectedOption => {
        // _fields({ ...fields, instituicao: selectedOption });

        if (selectedOption) {
            _filters({ ...filters, instituicao: selectedOption.map(o => o.value) });
        } else {
            _filters({ ...filters, instituicao: null });
        }
    };

    const loadMunicipiosOptions = (inputValue, callback) => {
        axios
            .get(`${import.meta.env.VITE_SERVER}project/municipios/?nome=${inputValue}${prepareFilters(filters)}`)
            .then(function ({ data }) {
                callback(data);
            });
    };

    function currentPageVerify() {
        if (pag !== null) {
            return pag.pages === currentPage;
        }
    }

    const handleMapClick = async e => {
        if (toggle === 'list') return;

        const data = await getClickedFeatureId(mapRef.current.leafletElement, e.latlng);

        if (!data) {
            //_showPop(null);
            return;
        }

        const { ids } = data;
        /* filtrar pelos projetos ativos */
        const projectsToSee = projects_ids ? ids.filter(id => projects_ids.includes(id)) : ids;

        /* pede o id/nome dos projetos clicados */
        const { data: projects } = await axios.get(
            `${import.meta.env.VITE_SERVER}project/from_map/?ids=${projectsToSee.join(',')}`,
        );

        _projectsToView(projects);
        _showProjectsToView(true);
    };

    const loadNameOptions =
        (url = 'project/list/') =>
            (inputValue, callback) => {
                axios
                    .get(`${import.meta.env.VITE_SERVER}${url}?nome=${inputValue}${prepareFilters(filters)}`)
                    .then(function ({ data }) {
                        callback(data);
                    });
            };

    const goPrevious = () => {
        _currentPage(cp => cp - 1);
    }

    const goNext = () => {
        _currentPage(cp => cp + 1);
    }

    const goToMap = (bbox) => {
        _toggle('map');
        _showProjectsToView(false);
        _bbox(bbox);
    }

    return (<section id="mapa">
        <div className="map-header">
            <div className="title-xl">Mapeamento de Iniciativas Monitoradas</div>
            <div className="map-stats">

                <div className="stat">
                    <div className="title">Projetos</div>
                    <div className={styles.number}>
                        {!isFiltered && <>{data?.total}</>}
                        {isFiltered && <>{total}</>}
                    </div>
                </div>

                <div className="stat">
                    <div className={styles.title}>Modalidades</div>
                    <div className="chart">
                        <ModalidadesChart data={!isFiltered ? data?.modalidades : modalidade_data} />
                    </div>
                </div>

            </div>
        </div>
        <div className={styles.container}>
            <div className={styles['map-container']}>
                <Map center={position} zoomControl={false} zoom={zoom} ref={mapRef} maxZoom={18} minZoom={3} scrollWheelZoom={false} onClick={handleMapClick}>
                    <TileLayer
                        attribution='<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <WMSTileLayer
                        url={import.meta.env.VITE_GEOSERVER_URL}
                        layers="pppzcm:proj_atuacao"
                        format="image/png"
                        transparent={true}
                        opacity={0.8}
                        cql_filter={projects_ids ? `project_id in (${projects_ids.join(',')})` : 'project_id>0'}
                    />

                    <ZoomControl position="bottomright" />
                </Map>
            </div>

            <div className={`p-4 ${styles.filter_panel}`}>
                <div className="row">
                    <div className={`col-md-4 ${styles.chooser}`}>
                        <div className={`${chooserDisabled ? styles.disabled : ''}`}>
                            <div>Mapa</div>
                            {toggle === 'map' && <ToggleLeft onClick={() => !chooserDisabled && _toggle('list')} />}
                            {toggle === 'list' && <ToggleRight onClick={() => !chooserDisabled && _toggle('map')} />}
                            <div>Lista</div>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className={`col-md-4 ${styles.controls}`}>
                        <div className="mb-4">
                            <div className="col-md-4 fw-bold">Modalidades</div>
                            {modalidades && (
                                <div>
                                    <StyledReactSelect
                                        classNamePrefix={reactSelectClassNamePrefix}
                                        {...selectDefaults}
                                        onChange={selectedOption => onFilterChange('modalidades', selectedOption)}
                                        closeMenuOnSelect={false}
                                        components={animatedComponents}
                                        isMulti
                                        options={modalidades}
                                        value={fields['modalidades']}
                                    />
                                </div>
                            )}
                            {!modalidades && (
                                <div className="clearfix" style={{ width: 'inherit' }}>
                                    <div className="spinner-border spinner-border-sm" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mb-3 pb-3">
                            <div className="col-md-4 fw-bold">Linhas de ação</div>
                            {linhas_acao && (
                                <div>
                                    <StyledReactSelect
                                        classNamePrefix={reactSelectClassNamePrefix}
                                        {...selectDefaults}
                                        onChange={selectedOption => onFilterChange('linhas_acao', selectedOption)}
                                        closeMenuOnSelect={false}
                                        components={animatedComponents}
                                        isMulti
                                        options={linhas_acao}
                                        value={fields['linhas_acao']}
                                    />
                                </div>
                            )}
                            {!linhas_acao && (
                                <div className="clearfix" style={{ width: 'inherit' }}>
                                    <div className="spinner-border spinner-border-sm" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mb-3 pb-3">
                            <div className="col-md-4 fw-bold">Região</div>
                            {regioes && (
                                <div>
                                    <StyledReactSelect
                                        classNamePrefix={reactSelectClassNamePrefix}
                                        {...selectDefaults}
                                        onChange={selectedOption => onFilterChange('regioes', selectedOption)}
                                        closeMenuOnSelect={false}
                                        components={animatedComponents}
                                        isMulti
                                        options={regioes}
                                        value={fields['regioes']}
                                    />
                                </div>
                            )}
                            {!regioes && (
                                <div className="clearfix" style={{ width: 'inherit' }}>
                                    <div className="spinner-border spinner-border-sm" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mb-3 pb-3">
                            <div className="col-md-4 fw-bold">Estado</div>
                            {ufs && (
                                <div>
                                    <StyledReactSelect
                                        classNamePrefix={reactSelectClassNamePrefix}
                                        {...selectDefaults}
                                        onChange={selectedOption => onFilterChange('ufs', selectedOption)}
                                        closeMenuOnSelect={false}
                                        components={animatedComponents}
                                        isMulti
                                        options={ufs}
                                        value={fields['ufs']}
                                    />
                                </div>
                            )}
                            {!ufs && (
                                <div className="clearfix" style={{ width: 'inherit' }}>
                                    <div className="spinner-border spinner-border-sm" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mb-3 pb-3">
                            <div className="col-md-4 fw-bold">Município</div>
                            <div>
                                <StyledAsyncReactSelect
                                    classNamePrefix={reactSelectClassNamePrefix}
                                    {...selectDefaults}
                                    placeholder="digite..."
                                    onChange={selectedOption => onFilterMunicipioChange(selectedOption)}
                                    closeMenuOnSelect={false}
                                    loadOptions={loadMunicipiosOptions}
                                    isClearable
                                    isMulti
                                    value={fields['municipios']}
                                />
                            </div>
                        </div>

                        <div className="mb-2 pb-3">
                            <div className="col-md-5 fw-bold">Nome da instituição</div>
                            <div>
                                <StyledAsyncReactSelect
                                    classNamePrefix={reactSelectClassNamePrefix}
                                    {...selectDefaults}
                                    placeholder="digite..."
                                    onChange={selectedOption => onFilterInstNameChange(selectedOption)}
                                    isMulti
                                    closeMenuOnSelect={false}
                                    loadOptions={loadNameOptions('project/instiuicao/list/')}
                                    isClearable
                                    value={fields['instituicao']}
                                />
                            </div>
                        </div>

                        <div className="mb-2">
                            <div className="col-md-4 fw-bold">Nome do projeto</div>
                            <div>
                                <StyledAsyncReactSelect
                                    classNamePrefix={reactSelectClassNamePrefix}
                                    className="no-down"
                                    {...selectDefaults}
                                    placeholder="digite..."
                                    onChange={selectedOption => onFilterNameChange(selectedOption)}
                                    closeMenuOnSelect={false}
                                    loadOptions={loadNameOptions()}
                                    isClearable
                                    value={fields['id']}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {!!showProjectsToView && toggle === 'map' && <div className={`p-4 ${styles.projects_panel}`}>
                <div className="row">
                    <div className={`col-md-4 ${styles.projects}`}>
                        <div className="mb-4">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Projeto clicados no mapa</th>
                                        <th>Instituição</th>
                                        <th>Região</th>
                                        <th>Ações</th>
                                        <th onClick={() => _showProjectsToView(false)} className={styles['close-button']}>x</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!!projectsToView && projectsToView.map(({ id, nome, instituicao_nome, regioes, bbox, total_members }) => (
                                        <tr key={id}>
                                            <td>{nome}</td>
                                            <td>{instituicao_nome}</td>
                                            <td>{regioes.join(', ')}</td>
                                            <td colSpan={2}>
                                                <div className={styles['project-buttons']}>
                                                    <Link to={`/projeto-single/${id}`}><GoProject /></Link>
                                                    {bbox && (<div onClick={() => goToMap(bbox)}><GoMap /></div>)}
                                                </div>
                                            </td>
                                        </tr>))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>}

            {projects?.length && toggle === 'list' && <div className={`p-4 ${styles.projects_panel}`}>
                <div className="row">
                    <div className={`col-md-4 ${styles.projects}`}>
                        <div className="mb-4">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Projeto filtrado</th>
                                        <th>Instituição</th>
                                        <th>Região</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!!projects && projects.map(({ id, nome, instituicao_nome, regioes, bbox, total_members }) => (
                                        <tr key={id}>
                                            <td>{nome}</td>
                                            <td>{instituicao_nome}</td>
                                            <td>{regioes.join(', ')}</td>
                                            <td>
                                                <div className={styles['project-buttons']}>
                                                    <Link to={`/projeto-single/${id}`}><GoProject /></Link>
                                                    {bbox && (<div onClick={() => goToMap(bbox)}><GoMap /></div>)}
                                                </div>
                                            </td>
                                        </tr>))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                {showList && pag !== null && pag.pages && pag.pages > 1 && (<div className={styles.paginator}>
                    {/* <ReactPaginate
                        previousLabel={'Anterior'}
                        nextLabel={'Próximo'}
                        breakLabel={'...'}
                        breakClassName={'break-me'}
                        pageCount={pag != null && pag.pages}
                        marginPagesDisplayed={2}
                        previousClassName={currentPage !== 1 ? 'page-link previousPage' : styles['disabled-previous']}
                        nextClassName={currentPageVerify() ? styles['disabled-next'] : `page-link nextPage`}
                        pageClassName={`page-link ${styles['disabled-mobile']}`}
                        pageRangeDisplayed={5}
                        onPageChange={e => _currentPage(e.selected + 1)}
                        containerClassName={`pagination ${styles['pagination']}`}
                        subContainerClassName={`pages ${styles['pagination']}`}
                        activeClassName={`${styles['active']}`}
                        forcePage={currentPage - 1}
                    /> */}
                    {currentPage !== 1 && <div onClick={goPrevious}><Previous /></div>}
                    {currentPage === 1 && <div className={styles.disabled}><Previous /></div>}
                    {!!currentPageVerify() && <div className={styles.disabled}><Next /></div>}
                    {!currentPageVerify() && <div onClick={goNext}><Next /></div>}

                </div>)}
            </div>}
        </div>
    </section>)

}

function ModalidadesChart({ data }) {

    const [series, _series] = useState([44, 55, 41, 17]);
    const [options, _options] = useState({
        labels: ["Jan", "Feb", "Mar", "Dec"],
        chart: {
            type: 'donut',
        },
        dataLabels: {
            enabled: false,
        },
        legend: {
            show: false,
        },
        colors: ['#5A6FC0', '#DE6E6A', '#9ECA7F', '#F2CA6B'],
    });

    useEffect(() => {
        if (!!data) {
            let s = [];
            let l = [];

            for (let i of data) {
                if(!i.modalidade_id) continue;

                s.push(i.count);
                l.push(i.nome);
            }

            _series(s);
            _options(o => ({ ...o, labels: l }));
        }
    }, [data]);

    if (!data) return (<></>)

    return (<div className={styles.chart}>
        {!!series && <Chart
            options={options}
            series={series}
            type="donut"
            width="50%"
        />}

        <div className={styles.legend}>
            {data.map(d => <div key={d.modalidade_id} className={styles.item}>
                <div></div>
                <div>{d.nome}</div>
            </div>)}
        </div>
    </div>)
}