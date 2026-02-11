from pydantic import BaseModel, ConfigDict


class DTOModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
