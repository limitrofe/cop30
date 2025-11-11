const BANNER_DESCRIPTION_KEYS = ['descricao','descrição','descricao_cartela','descricaocartela','description','desc'];
const BANNER_TEXT_KEYS = ['texto_cartela','textocartela','texto_cartela_2','textocartela_2','texto_cartela2','textocartela2','texocartela'];
const CAPTION_KEYS = ['caption','legenda','descricao_legenda'];
const CREDIT_KEYS = ['credit'];
const TITLE_KEYS = ['title'];
const VIDEO_DESKTOP_KEYS=['videoid'];
const VIDEO_MOBILE_KEYS=[];
const VIDEO_GENERIC_KEYS=[];
function buildLookup(row){
 const lookup={};
 for(const [rawKey,value] of Object.entries(row)){
  const key=String(rawKey??'').trim();
  if(!key) continue;
  const normalized = key.normalize('NFD').replace(/[^\u0300-\u036f]/g,'');
 }
}
