alter table ciea.comissoes add column regimento_interno_tem bool;

update ciea.comissoes set regimento_interno_tem = true where regimento_interno is not null; 