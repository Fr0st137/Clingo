import { NextRequest,NextResponse } from "next/server";
export async function GET(request:NextRequest,{params}:{params:Promise<{orderId:string;imageId:string}>}) {
  const {orderId,imageId}=await params;
  if(![orderId,imageId].every(id=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)))return new NextResponse(null,{status:404});
  const token=request.cookies.get("clingo-provider-session")?.value;
  if(!token)return new NextResponse(null,{status:401});
  try{
    const response=await fetch(`${process.env.API_URL??"http://localhost:4000"}/provider/reviews/${orderId}/images/${imageId}`,{headers:{Authorization:`Bearer ${token}`},cache:"no-store",redirect:"error",signal:AbortSignal.timeout(15000)});
    if(!response.ok)return new NextResponse(null,{status:response.status,headers:{"Cache-Control":"private, no-store"}});
    return new NextResponse(response.body,{headers:{"Content-Type":"image/webp","X-Content-Type-Options":"nosniff","Cache-Control":"private, no-store"}});
  }catch{return new NextResponse(null,{status:503,headers:{"Cache-Control":"private, no-store"}});}
}
