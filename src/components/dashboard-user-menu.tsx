"use client";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { LogOut, Shield, User2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type DashboardUserMenuProps = {
  name: string;
  roleLabel: string;
};

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "DV";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function DashboardUserMenu({
  name,
  roleLabel,
}: DashboardUserMenuProps) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const initials = initialsFromName(name);
  const open = Boolean(anchorEl);

  async function handleLogout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    setAnchorEl(null);
    router.replace("/login");
  }

  return (
    <>
      <IconButton
        aria-label="Abrir opciones de usuario"
        aria-expanded={open}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          position: "relative",
          width: 52,
          height: 52,
          border: "1px solid rgba(255,255,255,0.72)",
          backgroundColor: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(18px)",
          boxShadow: "0 14px 32px rgba(0,0,0,0.08)",
          transition: "transform 160ms ease, background-color 160ms ease",
          "&:hover": {
            backgroundColor: "#ffffff",
            transform: "scale(1.02)",
          },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            borderRadius: "999px",
            background:
              "linear-gradient(135deg, rgba(254,205,211,0.55), transparent 52%, rgba(225,190,231,0.4))",
            opacity: 0.9,
          }}
        />
        <Typography
          sx={{
            position: "relative",
            zIndex: 1,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.16em",
            color: "#4a3c58",
          }}
        >
          {initials}
        </Typography>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.5,
              width: "min(22rem, calc(100vw - 1rem))",
              overflow: "hidden",
              borderRadius: "28px",
              border: "1px solid rgba(255,255,255,0.72)",
              backgroundColor: "rgba(255,255,255,0.9)",
              backdropFilter: "blur(18px)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
            },
          },
        }}
      >
        <Box
          sx={{
            pointerEvents: "none",
            position: "absolute",
            insetInline: 0,
            top: 0,
            height: 96,
            background:
              "linear-gradient(135deg, rgba(254,205,211,0.55), transparent 58%, rgba(225,190,231,0.45))",
          }}
        />

        <Paper
          elevation={0}
          sx={{
            position: "relative",
            zIndex: 1,
            border: 0,
            backgroundColor: "transparent",
            p: 2,
          }}
        >
          <Stack spacing={2}>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="flex-start"
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    color: "#4a3c58",
                    backgroundColor: "rgba(253,252,245,0.95)",
                    border: "1px solid rgba(255,255,255,0.82)",
                    boxShadow: "0 8px 18px rgba(0,0,0,0.06)",
                  }}
                >
                  {initials}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "rgba(74, 60, 88, 0.38)",
                    }}
                  >
                    Sesion activa
                  </Typography>
                  <Typography
                    sx={{
                      color: "#1f2937",
                      fontSize: 14,
                      fontWeight: 600,
                      lineHeight: 1.2,
                    }}
                  >
                    {name}
                  </Typography>
                  <Typography
                    sx={{
                      color: "rgba(74, 60, 88, 0.65)",
                      fontSize: 12,
                    }}
                  >
                    {roleLabel}
                  </Typography>
                </Box>
              </Stack>

              <IconButton
                size="small"
                onClick={() => setAnchorEl(null)}
                sx={{
                  color: "rgba(74, 60, 88, 0.56)",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.8)",
                    color: "#4a3c58",
                  },
                }}
              >
                <X className="h-4 w-4" />
              </IconButton>
            </Stack>

            <Stack spacing={1.25}>
              <Paper
                elevation={0}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 1.25,
                  borderRadius: "18px",
                  border: "1px solid rgba(232, 213, 229, 0.65)",
                  backgroundColor: "rgba(253,252,245,0.82)",
                }}
              >
                <User2 className="h-4 w-4 text-[#b1a1c6]" />
                <Typography
                  sx={{
                    color: "#4a3c58",
                    fontSize: 14,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {name}
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 1.25,
                  borderRadius: "18px",
                  border: "1px solid rgba(232, 213, 229, 0.65)",
                  backgroundColor: "rgba(253,252,245,0.82)",
                }}
              >
                <Shield className="h-4 w-4 text-[#b1a1c6]" />
                <Typography sx={{ color: "#4a3c58", fontSize: 14 }}>
                  {roleLabel}
                </Typography>
              </Paper>
            </Stack>

            <Divider sx={{ borderColor: "rgba(232, 213, 229, 0.55)" }} />

            <Paper
              elevation={0}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                px: 1.5,
                py: 1.25,
                borderRadius: "18px",
                border: "1px solid rgba(232, 213, 229, 0.65)",
                backgroundColor: "rgba(255,255,255,0.88)",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <LogOut className="h-4 w-4 text-[#b1a1c6]" />
                <Typography
                  sx={{ color: "#4a3c58", fontSize: 14, fontWeight: 500 }}
                >
                  Cerrar sesion
                </Typography>
              </Stack>

              <Button
                type="button"
                size="small"
                variant="outlined"
                onClick={() => {
                  void handleLogout();
                }}
                startIcon={<LogOut className="h-3.5 w-3.5" />}
                sx={{
                  minHeight: 34,
                  px: 1.5,
                  fontSize: 12,
                }}
              >
                Salir
              </Button>
            </Paper>
          </Stack>
        </Paper>
      </Popover>
    </>
  );
}
