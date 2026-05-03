from pydantic import BaseModel, Field, root_validator
from typing import Union, Optional


class ItemBase(BaseModel):
    name: str = Field(
        ...,
        min_length=3,
        regex=r"^[a-zA-Z0-9 _-]+$",
        examples="Gadget",
        description="The name of the item, must be alphanumeric and at least 3 characters long",
    )
    price: float = Field(
        ...,
        gt=0,
        examples=35.4,
        description="The price of the item, must be a positive number",
    )
    is_offer: Union[bool, None] = Field(
        None, description="Indicates if the item is on offer"
    )


class Item(ItemBase):
    id: int


class RequestPutItem(ItemBase):
    name: Optional[str] = None
    price: Optional[float] = None

    @root_validator
    def at_least_one_field(cls, values):
        if not any(values.values()):
            raise ValueError("At least one field must be provided")
        return values


class ResponsePost(BaseModel):
    id: int
    message: Union[str, None] = None
