from pydantic import BaseModel, Field


class UserBase(BaseModel):
    username: str = Field(
        ..., description="Nom d'utilisateur utilisé pour se connecter", examples="toto"
    )
    full_name: str | None = None


class UserLogin(UserBase):
    password: str = Field(
        ..., description="Mot de passe de l'utilisateur", examples="secret"
    )


class UserLoginResponse(UserBase):
    message: str = Field(..., description="Message de confirmation de la connexion")
