const pages=new Map([['/','/'],['/index.html','/'],['/en','/en/'],['/en/','/en/'],['/en/index.html','/en/']]);
const bot=/bot|crawler|spider|slurp|headless|lighthouse|pagespeed|curl|wget|python-requests|preview/iu;
export function countedPage(request,response){
  const path=pages.get(new URL(request.url).pathname);
  if(request.method!=='GET'||!path||response.status!==200||!response.headers.get('Content-Type')?.includes('text/html'))return null;
  if(bot.test(request.headers.get('User-Agent')||''))return null;
  return path;
}
export async function recordPageView(db,path){
  const date=new Date().toISOString().slice(0,10);
  await db.prepare('INSERT INTO portfolio_page_views(view_date,page_path,views) VALUES (?1,?2,1) ON CONFLICT(view_date,page_path) DO UPDATE SET views=views+1').bind(date,path).run();
}
export async function pageViewTotals(db){
  const {results}=await db.prepare("SELECT page_path, SUM(views) AS total, SUM(CASE WHEN view_date=date('now') THEN views ELSE 0 END) AS today, SUM(CASE WHEN view_date>=date('now','-6 days') THEN views ELSE 0 END) AS seven, SUM(CASE WHEN view_date>=date('now','-29 days') THEN views ELSE 0 END) AS thirty FROM portfolio_page_views GROUP BY page_path").all();
  const rows=results||[];
  const sum=key=>rows.reduce((n,row)=>n+Number(row[key]||0),0);
  return {today:sum('today'),seven:sum('seven'),thirty:sum('thirty'),total:sum('total'),pages:Object.fromEntries(rows.map(row=>[row.page_path,{today:Number(row.today||0),seven:Number(row.seven||0),thirty:Number(row.thirty||0),total:Number(row.total||0)}]))};
}
