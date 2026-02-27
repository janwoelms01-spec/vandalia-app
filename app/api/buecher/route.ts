import { NextResponse } from "next/server";
import { PrismaClient, titles_identifier_type, titles_media_type } from "@prisma/client";
import { requireApiPermission, requireApiAnyPermission } from "@/lib/api/requireApiPermissions";
import crypto from "crypto";
import { copies_state } from "@prisma/client";

const prisma = new PrismaClient();

function newId25(){
    return crypto.randomUUID().replace(/-/g, "").slice(0,25);
}
function pad2(n: number) {
  return String(n).padStart(2, "0");
}


function pad4(n:number){
    return String(n).padStart(4, "0");
}

function toCode(name: string, maxLen = 3){
    const s = name
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^-+|-+$€/g,"")
    .replace(/-/g, "")

    const upper = s.toUpperCase();
    return (upper.length ? upper : "X").slice(0,maxLen);
}

async function uniqueSubcategoryCode(tx: PrismaClient, categoryID: string, base: string){
    for (let i=0; i<100; i++){
        const code=i===0?base:`${base}${i+1}`;
        const exists = await (tx as any).subcategories.findUnique({
            where: {category_id_code: {category_id: categoryID, code}}
        })
        if(!exists) return code;
    }
    throw new Error("SUBCATEGORY_CODE_EXHAUSTED")
}

async function uniqueCategoryCode(tx: PrismaClient, base: string) {
  // versucht: BASE, BASE2, BASE3 ...
  for (let i = 0; i < 100; i++) {
    const code = i === 0 ? base : `${base}${i + 1}`;
    const exists = await (tx as any).categories.findUnique({ where: { code } });
    if (!exists) return code;
  }
  throw new Error("CATEGORY_CODE_EXHAUSTED");
}
export async function POST(req:Request) {
    const auth = await requireApiAnyPermission(["BACKUP_CREATE", "BOOKS_MANAGE"]);
    if (!auth.ok) return auth.response;

    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({error: "Invalid JSON"}, {status:400});
    }
    
    const title = String(body?.title ?? "").trim();
    const categoryName= String(body?.category_name ?? "").trim();
    const subcategoryNameRaw=body?.subcategory_name != null ? String(body.subcategory_name).trim(): "";
    const subcategoryName = subcategoryNameRaw.length ? subcategoryNameRaw : "Allgemein";

    const mediaTypeRaw = String(body?.media_type ?? "").trim();
    if(!title) return NextResponse.json({error:"Titel bitte eingeben"}, {status:400});
    if(!categoryName) return NextResponse.json({error: "Bitte Kategorie angeben"}, {status: 400});
    if(!mediaTypeRaw) return NextResponse.json({error: "Bitte Medium angeben"}, {status: 400});
    
    const media_type = (titles_media_type as any)[mediaTypeRaw] as titles_media_type | undefined;
    if(!media_type){
        return NextResponse.json({error: "Nich gültige Medienform", allowed: Object.keys(titles_media_type)}, {status:400});

    }

    const authors = body?.authors != null ? String(body.authors):null;
    const publisher = body?.publisher != null ? String(body.publisher): null;
    const published_at = body?.published_at != null ? String(body.published_at): null;
    const language = body?.language != null ? String(body.language): null;
    const cover_url=body?.cover_url != null ? String(body.cover_url): null;

   const identifierTypeRaw =
  body?.identifier_type != null ? String(body.identifier_type).trim() : "NONE";

    const identifier_type =
  (titles_identifier_type as any)[identifierTypeRaw] as titles_identifier_type | undefined;

    if(!identifier_type){   
        return NextResponse.json({error: "Kein Richtiger ID Typ", allowed: Object.keys(titles_identifier_type)}, {status:400});
    }

    const identifier_value = body?.identifier_value != null ? String(body.identifier_value) : null;

    try{
        const created = await prisma.$transaction(async (tx) => {
            const catCodeBase = toCode(categoryName, 3);

            let category = await (tx as any).categories.findFirst({
                where: {name: categoryName},
                select: {id: true, code: true, name: true, is_active:true },
            });

            if (!category){
                const catCode = await uniqueCategoryCode(tx as any, catCodeBase);

                category = await (tx as any).categories.create({
                    data:{
                        id: newId25(),
                        name: categoryName,
                        code: catCode,
                        is_active: true,
                    },
                    select: {id:true, code:true, name:true, is_active: true},
                });
            }
            const subCodeBase = toCode(subcategoryName, 3);
            let subcategory = await (tx as any).subcategories.findFirst({
                where: {category_id:category.id, name: subcategoryName},
                select: {id:true, code:true, name:true, category_id:true, is_active: true},
            });
            if (!subcategory){
                const subcode = await uniqueSubcategoryCode(tx as any, category.id, subCodeBase);

                subcategory= await (tx as any).subcategories.create({
                    data:{
                        id: newId25(),
                        category_id: category.id,
                        name: subcategoryName,
                        code: subcode,
                        is_active: true,
                    },
                    select:{id:true, code:true, name:true, category_id: true, is_active:true},
                });
            }
            const counter = await (tx as any).code_counters.upsert({
                where: {
                    category_id_subcategory_id:{
                        category_id: category.id,
                        subcategory_id: subcategory.id,
                    },
                },
                create:{
                    id: newId25(),
                    category_id:category.id,
                    subcategory_id: subcategory.id,
                    next_number: 1,
                },
                update: {},
                select: {id: true, next_number:true},
            });

            const seq = counter.next_number;
            const short_code = `${category.code}-${subcategory.code}-${pad4(seq)}`;

            await (tx as any).code_counters.update({
                where: {id: counter.id},
                data:{ next_number: {increment: 1}},
            });

           const createdTitle = await (tx as any).titles.create({
    data: {
        id: newId25(),
        title,
        media_type,
        identifier_type,
        identifier_value: identifier_value || null,
        authors,
        publisher,
        published_at,
        language,
        cover_url,
        category_id: category.id,
        subcategory_id: subcategory.id,
        short_code
    },
    select:{
        id:true,
        title: true,
        short_code: true,
        category_id: true,
        subcategory_id: true,
        created_at: true,
        categories: { select: { id: true, name: true, code: true } },
        subcategories: { select: { id: true, name: true, code: true } },
    },
});
await (tx as any).copies.create({
    data: {
        id: newId25(),
        title_id: createdTitle.id,  // ggf. titles_id wenn dein Feld so heißt
        copy_code: `${createdTitle.short_code}-${pad2(1)}`,
        state: copies_state.IN_LIBARY,
       // an dein Enum anpassen!
        home_location: "Archiv",   // Default oder aus body
        is_active: true,           // falls du das Feld hast
    },
});           
        });
        return NextResponse.json({title: created}, {status: 201});
    } catch (e: any){
        if (e?.code === "P2002"){
            return NextResponse.json({ error: "Konflikt unique constraint"}, {status: 409});
        }
        console.error("CREATE TITLE ERROR:", e);

        if(process.env.NODE_ENV !== "production"){
            return NextResponse.json( {error: "Internal Server Error", message: e?.message ?? String(e)}, {status: 500});
        }
        return NextResponse.json({error: "Internal Server Error"}, {status:500});
    }
}

export async function GET(){

   const auth = await requireApiPermission("BOOKS_READ");
   if(!auth.ok) return auth.response;

    const titles = await prisma.titles.findMany({
        where: {is_active:true},
        orderBy: {created_at:"desc"},
        select:{
            id:true,
            title: true,
            authors: true,
            publisher: true,
            published_at: true,
            language: true,
            cover_url: true,
            short_code: true,
            identifier_type: true,
            created_at:true,
            _count: {select: {copies: {where: {is_active: true},},},},
        },
    });

    return NextResponse.json({titles});
}