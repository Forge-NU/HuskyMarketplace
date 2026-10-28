import PhotoItem from "@/components/PhotoItem";
export default async function ItemPage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <PhotoItem id={id}/>}
