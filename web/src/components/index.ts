/**
 * Componentes de interface reutilizáveis (sem acesso a dados; seguros para
 * componentes cliente). Os componentes em ./conteudo, ./analise e ./rh leem
 * web/content e são apenas de servidor — importe-os pelo caminho completo.
 */
export { Card, type CardProps } from "./Card";
export { CandidatoBadge, type CandidatoBadgeProps } from "./CandidatoBadge";
export { FonteLink, type FonteLinkProps, type TipoFonte } from "./FonteLink";
export { PdfPaginaLink, type PdfPaginaLinkProps } from "./PdfPaginaLink";
export { StatusChip, type StatusChipProps } from "./StatusChip";
export { ViesTag, type ViesTagProps } from "./ViesTag";
export { ConfiancaBadge, HorizonteBadge, type ConfiancaBadgeProps, type HorizonteBadgeProps } from "./ConfiancaBadge";
export { Tabs, type TabsProps, type TabItem } from "./Tabs";
export { LegendaCandidatos, LegendaVieses, Legendas } from "./Legenda";
export { ParCandidatos, type ParCandidatosProps } from "./ParCandidatos";
export { SemProposta, type SemPropostaProps } from "./SemProposta";
export { Secao, type SecaoProps } from "./Secao";
