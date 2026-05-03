from fastapi import APIRouter, Body, HTTPException, Path
from _models.items import Item, ResponsePost, RequestPutItem
import uuid

router = APIRouter()

list_items = [
    Item(id=1, name="Portal Gun", price=42.0, is_offer=True),
    Item(id=2, name="Plumbus", price=32.0, is_offer=True),
    Item(id=3, name="Meeseeks Box", price=12.5, is_offer=False),
    Item(id=4, name="Butter Robot", price=5.0, is_offer=False),
]


@router.get("/", response_model=list[Item])
async def read_items():
    return list_items


@router.get("/{id}", response_model=Item)
def get_item(id: int = Path(..., gt=0)):
    for item in list_items:
        if item.id == id:
            return Item(
                id=item.id,
                name=item.name,
                price=item.price,
                message="Item trouvé avec succès ✅",
            )

    # Si l’item n’existe pas → 404
    raise HTTPException(
        status_code=404,
        detail=f"Aucun item trouvé avec l'id {id}",
    )


@router.post("/", response_model=ResponsePost, status_code=201)
def create_item(item: Item = Body(...)):
    my_uuid = uuid.uuid4()
    print(f"Creating item: {item}")
    return {"id": my_uuid.int, "message": "Item created successfully"}


@router.put("/{id}", response_model=ResponsePost)
def update_item(id: int = Path(..., gt=0), item: RequestPutItem = Body(...)):
    print(f"Updating item {id} with data: {item}")
    return {"id": id, "message": "Item updated successfully"}


@router.delete("/{id}", response_model=ResponsePost)
def delete_item(id: int):
    return {"id": id, "message": "Item deleted successfully"}
