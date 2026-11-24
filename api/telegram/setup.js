export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  const auth=req.headers.authorization;
  if(!process.env.TELEGRAM_SETUP_SECRET||auth!=="Bearer "+process.env.TELEGRAM_SETUP_SECRET)return res.status(401).json({error:"Unauthorized"});
  const token=process.env.TELEGRAM_BOT_TOKEN;
  const secret=process.env.TELEGRAM_WEBHOOK_SECRET;
  if(!token||!secret)return res.status(500).json({error:"Missing Telegram configuration"});
  const url="https://cloverchat-telegram-otp-alam-a606.vercel.app/api/telegram/webhook";
  try{
    const r=await fetch(`https://api.telegram.org/bot${token}/setWebhook`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url,secret_token:secret})});
    const data=await r.json();
    return res.status(r.ok?200:502).json(data);
  }catch(e){return res.status(500).json({error:"Telegram request failed"});}
}
