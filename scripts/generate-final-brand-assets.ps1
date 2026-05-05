Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$webPublic = Join-Path $root "apps\web\public"
$mobileAssets = Join-Path $root "apps\mobile\assets"
New-Item -ItemType Directory -Force -Path $webPublic, $mobileAssets | Out-Null

function New-GoldBrush {
    param([System.Drawing.RectangleF]$Rect, [float]$Angle = 52)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($Rect, [System.Drawing.Color]::White, [System.Drawing.Color]::Black, $Angle)
    $blend = New-Object System.Drawing.Drawing2D.ColorBlend(6)
    $blend.Positions = [single[]](0, .16, .38, .62, .82, 1)
    $blend.Colors = [System.Drawing.Color[]]@(
        [System.Drawing.Color]::FromArgb(255, 255, 247, 184),
        [System.Drawing.Color]::FromArgb(255, 255, 225, 112),
        [System.Drawing.Color]::FromArgb(255, 212, 175, 55),
        [System.Drawing.Color]::FromArgb(255, 150, 105, 20),
        [System.Drawing.Color]::FromArgb(255, 100, 68, 10),
        [System.Drawing.Color]::FromArgb(255, 252, 235, 148)
    )
    $brush.InterpolationColors = $blend
    return $brush
}

function New-Bitmap {
    param([int]$Width, [int]$Height, [switch]$Transparent)
    $bmp = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    if ($Transparent) { $g.Clear([System.Drawing.Color]::Transparent) } else { $g.Clear([System.Drawing.Color]::FromArgb(255, 4, 6, 18)) }
    return @{ Bitmap = $bmp; Graphics = $g }
}

function Draw-BackgroundGradient {
    param($g, [int]$Width, [int]$Height)
    $rect = [System.Drawing.Rectangle]::new(0, 0, $Width, $Height)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, [System.Drawing.Color]::FromArgb(255, 4, 6, 18), [System.Drawing.Color]::FromArgb(255, 14, 19, 44), 35)
    $g.FillRectangle($brush, $rect)
    $brush.Dispose()

    $goldGlow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 212, 175, 55))
    $g.FillEllipse($goldGlow, -260, -220, 620, 620)
    $g.FillEllipse($goldGlow, $Width - 330, 40, 520, 520)
    $goldGlow.Dispose()
}

function Draw-WealthSpotLogo {
    param($g, [float]$X, [float]$Y, [float]$Size)
    $state = $g.Save()
    $scale = $Size / 512.0
    $g.TranslateTransform($X, $Y)
    $g.ScaleTransform($scale, $scale)

    # Outer soft halo.
    for ($i = 0; $i -lt 5; $i++) {
        $alpha = [Math]::Max(10, 42 - ($i * 7))
        $color = [System.Drawing.Color]::FromArgb($alpha, 212, 175, 55)
        $pen = New-Object System.Drawing.Pen($color, (16 + $i * 12))
        $g.DrawEllipse($pen, 56 - ($i * 2), 56 - ($i * 2), 400 + ($i * 4), 400 + ($i * 4))
        $pen.Dispose()
    }

    # Dark navy enamel disk.
    $diskPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diskPath.AddEllipse(58, 58, 396, 396)
    $diskBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($diskPath)
    $diskBrush.CenterPoint = [System.Drawing.PointF]::new(230, 175)
    $diskBrush.CenterColor = [System.Drawing.Color]::FromArgb(255, 27, 23, 62)
    $diskBrush.SurroundColors = [System.Drawing.Color[]]@([System.Drawing.Color]::FromArgb(255, 3, 5, 17))
    $g.FillEllipse($diskBrush, 58, 58, 396, 396)
    $diskBrush.Dispose(); $diskPath.Dispose()

    # Rings, precisely centered.
    $outerBrush = New-GoldBrush ([System.Drawing.RectangleF]::new(50, 50, 412, 412)) 45
    $outerPen = New-Object System.Drawing.Pen($outerBrush, 17)
    $g.DrawEllipse($outerPen, 60, 60, 392, 392)
    $outerPen.Dispose(); $outerBrush.Dispose()

    $innerBrush = New-GoldBrush ([System.Drawing.RectangleF]::new(86, 86, 340, 340)) 45
    $innerPen = New-Object System.Drawing.Pen($innerBrush, 4)
    $g.DrawEllipse($innerPen, 88, 88, 336, 336)
    $innerPen.Dispose(); $innerBrush.Dispose()

    # Subtle crown/roof arc, balanced and aligned to the W centerline.
    $arcColor = [System.Drawing.Color]::FromArgb(115, 212, 175, 55)
    $arcPen = New-Object System.Drawing.Pen($arcColor, 5)
    $arcPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $arcPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $arcPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $arcPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $arcPath.AddBezier(116, 246, 152, 137, 213, 148, 256, 183)
    $arcPath.AddBezier(256, 183, 299, 148, 360, 137, 396, 246)
    $g.DrawPath($arcPen, $arcPath)
    $arcPath.Dispose(); $arcPen.Dispose()

    # Selected W style: rounded premium arms, no center black circle.
    $w = [System.Drawing.PointF[]]@(
        [System.Drawing.PointF]::new(132, 164),
        [System.Drawing.PointF]::new(189, 354),
        [System.Drawing.PointF]::new(256, 229),
        [System.Drawing.PointF]::new(323, 354),
        [System.Drawing.PointF]::new(380, 164)
    )

    $shadow = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, 17, 10, 2), 68)
    $shadow.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $shadow.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $shadow.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $g.DrawLines($shadow, $w)
    $shadow.Dispose()

    $wBrush = New-GoldBrush ([System.Drawing.RectangleF]::new(112, 142, 288, 240)) 55
    $wPen = New-Object System.Drawing.Pen($wBrush, 52)
    $wPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $wPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $wPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $g.DrawLines($wPen, $w)
    $wPen.Dispose(); $wBrush.Dispose()

    # Clean bevel highlights, carefully offset from W edges.
    $hiColor = [System.Drawing.Color]::FromArgb(145, 255, 243, 166)
    $hiPen = New-Object System.Drawing.Pen($hiColor, 9)
    $hiPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $hiPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($hiPen, 145, 171, 190, 314)
    $g.DrawLine($hiPen, 266, 238, 321, 331)
    $g.DrawLine($hiPen, 369, 171, 330, 314)
    $hiPen.Dispose()

    $g.Restore($state)
}

function Save-Png {
    param($Bitmap, [string]$Path)
    $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
}

# 512 transparent final logo.
$c = New-Bitmap 512 512 -Transparent
Draw-WealthSpotLogo $c.Graphics 0 0 512
Save-Png $c.Bitmap (Join-Path $webPublic "wealthspot-w-logo.png")
Save-Png $c.Bitmap (Join-Path $mobileAssets "wealthspot-w-logo.png")
Save-Png $c.Bitmap (Join-Path $mobileAssets "favicon.png")
$c.Graphics.Dispose(); $c.Bitmap.Dispose()

# 1024 app icon with full premium background.
$c = New-Bitmap 1024 1024
Draw-BackgroundGradient $c.Graphics 1024 1024
Draw-WealthSpotLogo $c.Graphics 164 164 696
Save-Png $c.Bitmap (Join-Path $mobileAssets "icon.png")
$c.Graphics.Dispose(); $c.Bitmap.Dispose()

# 1024 adaptive icon foreground with transparent safe zone.
$c = New-Bitmap 1024 1024 -Transparent
Draw-WealthSpotLogo $c.Graphics 212 212 600
Save-Png $c.Bitmap (Join-Path $mobileAssets "adaptive-icon.png")
$c.Graphics.Dispose(); $c.Bitmap.Dispose()

# Splash 1080x2340 with centered logo and wordmark.
$c = New-Bitmap 1080 2340
Draw-BackgroundGradient $c.Graphics 1080 2340
Draw-WealthSpotLogo $c.Graphics 340 860 400
$titleFont = New-Object System.Drawing.Font("Constantia", 76, [System.Drawing.FontStyle]::Bold)
$subFont = New-Object System.Drawing.Font("Segoe UI", 28, [System.Drawing.FontStyle]::Regular)
$titleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 239, 159))
$subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(190, 232, 220, 174))
$fmt = New-Object System.Drawing.StringFormat
$fmt.Alignment = [System.Drawing.StringAlignment]::Center
$c.Graphics.DrawString("WealthSpot", $titleFont, $titleBrush, [System.Drawing.RectangleF]::new(0, 1290, 1080, 95), $fmt)
$c.Graphics.DrawString("Private Wealth Access", $subFont, $subBrush, [System.Drawing.RectangleF]::new(0, 1386, 1080, 60), $fmt)
$fmt.Dispose(); $titleBrush.Dispose(); $subBrush.Dispose(); $titleFont.Dispose(); $subFont.Dispose()
Save-Png $c.Bitmap (Join-Path $mobileAssets "splash.png")
$c.Graphics.Dispose(); $c.Bitmap.Dispose()

# OG image 1200x630 with logo and premium graphics.
$c = New-Bitmap 1200 630
Draw-BackgroundGradient $c.Graphics 1200 630
$ringPenColor = [System.Drawing.Color]::FromArgb(80, 212, 175, 55)
$ringPen = New-Object System.Drawing.Pen($ringPenColor, 2)
$c.Graphics.DrawEllipse($ringPen, 742, -80, 520, 520)
$c.Graphics.DrawEllipse($ringPen, 812, 42, 380, 380)
$ringPen.Dispose()
Draw-WealthSpotLogo $c.Graphics 760 154 270
$bigFont = New-Object System.Drawing.Font("Constantia", 72, [System.Drawing.FontStyle]::Bold)
$tagFont = New-Object System.Drawing.Font("Segoe UI", 28, [System.Drawing.FontStyle]::Regular)
$smallFont = New-Object System.Drawing.Font("Segoe UI", 22, [System.Drawing.FontStyle]::Regular)
$goldText = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 239, 159))
$mutedText = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 226, 218, 190))
$c.Graphics.DrawString("WealthSpot", $bigFont, $goldText, 80, 205)
$c.Graphics.DrawString("Democratizing Premium Assets", $tagFont, $mutedText, 86, 298)
$c.Graphics.DrawString("Fractional real-estate investment • Private Wealth Access", $smallFont, $mutedText, 88, 358)
$goldText.Dispose(); $mutedText.Dispose(); $bigFont.Dispose(); $tagFont.Dispose(); $smallFont.Dispose()
Save-Png $c.Bitmap (Join-Path $webPublic "og-default.png")
$c.Graphics.Dispose(); $c.Bitmap.Dispose()

# SVG source and favicon.
$svg = @'
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">WealthSpot premium W medallion</title>
  <desc id="desc">A centered gold WealthSpot W medallion with dark navy enamel, gold rings, and no center dot.</desc>
  <defs>
    <radialGradient id="navy" cx="45%" cy="34%" r="72%"><stop offset="0" stop-color="#1B173E"/><stop offset="0.58" stop-color="#0D1029"/><stop offset="1" stop-color="#030511"/></radialGradient>
    <linearGradient id="gold" x1="110" y1="76" x2="402" y2="428" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFF7B8"/><stop offset="0.16" stop-color="#FFE170"/><stop offset="0.38" stop-color="#D4AF37"/><stop offset="0.62" stop-color="#966914"/><stop offset="0.82" stop-color="#64440A"/><stop offset="1" stop-color="#FCEB94"/></linearGradient>
    <filter id="glow" x="30" y="30" width="452" height="452" filterUnits="userSpaceOnUse"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#000" flood-opacity="0.42"/><feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#D4AF37" flood-opacity="0.28"/></filter>
  </defs>
  <g filter="url(#glow)">
    <circle cx="256" cy="256" r="198" fill="url(#navy)"/>
    <circle cx="256" cy="256" r="196" stroke="url(#gold)" stroke-width="17"/>
    <circle cx="256" cy="256" r="168" stroke="url(#gold)" stroke-width="4" opacity="0.78"/>
    <path d="M116 246C152 137 213 148 256 183C299 148 360 137 396 246" stroke="#D4AF37" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.45"/>
    <path d="M132 164L189 354L256 229L323 354L380 164" stroke="#110A02" stroke-width="68" stroke-linecap="round" stroke-linejoin="round" opacity="0.48"/>
    <path d="M132 164L189 354L256 229L323 354L380 164" stroke="url(#gold)" stroke-width="52" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M145 171L190 314M266 238L321 331M369 171L330 314" stroke="#FFF3A6" stroke-width="9" stroke-linecap="round" opacity="0.57"/>
  </g>
</svg>
'@
Set-Content -Path (Join-Path $webPublic "wealthspot-w-logo.svg") -Value $svg -Encoding UTF8
Set-Content -Path (Join-Path $webPublic "favicon.svg") -Value $svg -Encoding UTF8

Write-Host "Final WealthSpot brand assets generated."
