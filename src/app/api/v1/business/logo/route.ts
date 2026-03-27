import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";

const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { message: "No autenticado" } },
        { status: 401 },
      );
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Solo un administrador puede actualizar el logo" },
        },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: { message: "No se recibio ningun archivo" } },
        { status: 400 },
      );
    }

    if (file.type !== "image/png") {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "El logo debe cargarse como PNG",
          },
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "El logo supera el limite de 5 MB" },
        },
        { status: 400 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const publicDir = path.join(process.cwd(), "public");
    const logoPath = path.join(publicDir, "logo.png");

    await mkdir(publicDir, { recursive: true });
    await writeFile(logoPath, bytes);

    return NextResponse.json({
      success: true,
      data: {
        logoUrl: `/logo.png?v=${Date.now()}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "No se pudo actualizar el logo",
        },
      },
      { status: 400 },
    );
  }
}
