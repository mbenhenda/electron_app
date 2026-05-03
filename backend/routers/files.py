# routers/files.py
from fastapi import APIRouter, Form, UploadFile, File
from _models.files import FileResponse, MultipleFilesResponse

router = APIRouter()


@router.post(
    "/single/",
    response_model=FileResponse,
    summary="Upload a single file",
    description="Upload one file. Returns the file name and size in bytes.",
)
async def upload_single_file(file: UploadFile = File(...)):
    contents = await file.read()
    return FileResponse(filename=file.filename, file_size=len(contents))


@router.post(
    "/multiple/",
    response_model=MultipleFilesResponse,
    summary="Upload multiple files",
    description="Upload multiple files at once. Returns an array of file names and sizes.",
)
async def upload_multiple_files(files: list[UploadFile] = File(...)):
    file_list = []
    for f in files:
        contents = await f.read()
        file_list.append(FileResponse(filename=f.filename, file_size=len(contents)))
    return MultipleFilesResponse(files=file_list)


@router.post("/profile/")
async def create_file_profile(
    token: str = Form(...),
    file: UploadFile = File(...),
):
    contents = await file.read()
    return {
        "file_size": len(contents),
        "token": token,
        "file_content_type": file.content_type,
    }
