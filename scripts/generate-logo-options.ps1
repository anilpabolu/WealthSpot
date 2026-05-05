Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$webPublic = Join-Path $root "apps\web\public"
$mobileAssets = Join-Path $root "apps\mobile\assets"
New-Item -ItemType Directory -Force -Path $webPublic, $mobileAssets | Out-Null

function New-GoldBrush {
	param([System.Drawing.Rectangle]$Rect, [float]$Angle = 55)
	$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($Rect, [System.Drawing.Color]::White, [System.Drawing.Color]::Black, $Angle)
	$blend = New-Object System.Drawing.Drawing2D.ColorBlend(6)
	$blend.Positions = [single[]](0, .14, .34, .58, .78, 1)
	$blend.Colors = [System.Drawing.Color[]]@(
		[System.Drawing.Color]::FromArgb(255, 255, 249, 191),
		[System.Drawing.Color]::FromArgb(255, 255, 229, 119),
		[System.Drawing.Color]::FromArgb(255, 212, 175, 55),
		[System.Drawing.Color]::FromArgb(255, 143, 99, 19),
		[System.Drawing.Color]::FromArgb(255, 96, 65, 10),
		[System.Drawing.Color]::FromArgb(255, 251, 232, 142)
	)
	$brush.InterpolationColors = $blend
	return $brush
}

function New-Canvas {
	$bmp = New-Object System.Drawing.Bitmap(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
	$g = [System.Drawing.Graphics]::FromImage($bmp)
	$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
	$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
	$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
	$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
	$g.Clear([System.Drawing.Color]::Transparent)
	return @{ Bitmap = $bmp; Graphics = $g }
}

function Save-Option {
	param($Bitmap, [string]$Name)
	$webPath = Join-Path $webPublic $Name
	$mobilePath = Join-Path $mobileAssets $Name
	$Bitmap.Save($webPath, [System.Drawing.Imaging.ImageFormat]::Png)
	$Bitmap.Save($mobilePath, [System.Drawing.Imaging.ImageFormat]::Png)
}

function Draw-DarkDisc {
	param($g, [int]$X = 54, [int]$Y = 54, [int]$Size = 404)
	$path = New-Object System.Drawing.Drawing2D.GraphicsPath
	$path.AddEllipse($X, $Y, $Size, $Size)
	$brush = New-Object System.Drawing.Drawing2D.PathGradientBrush($path)
	$brush.CenterPoint = [System.Drawing.PointF]::new($X + $Size * .43, $Y + $Size * .28)
	$brush.CenterColor = [System.Drawing.Color]::FromArgb(255, 31, 27, 67)
	$brush.SurroundColors = [System.Drawing.Color[]]@([System.Drawing.Color]::FromArgb(255, 4, 6, 18))
	$g.FillEllipse($brush, $X, $Y, $Size, $Size)
	$brush.Dispose(); $path.Dispose()
}

function Draw-GoldRing {
	param($g, [int]$X = 62, [int]$Y = 62, [int]$Size = 388, [int]$Width = 15)
	$ringBrush = New-GoldBrush ([System.Drawing.Rectangle]::new($X - 4, $Y - 4, $Size + 8, $Size + 8)) 45
	$pen = New-Object System.Drawing.Pen($ringBrush, $Width)
	$g.DrawEllipse($pen, $X, $Y, $Size, $Size)
	$pen.Dispose(); $ringBrush.Dispose()
}

function Draw-W {
	param($g, [System.Drawing.PointF[]]$Points, [int]$Width = 48)
	$shadowColor = [System.Drawing.Color]::FromArgb(115, 18, 12, 3)
	$shadow = New-Object System.Drawing.Pen($shadowColor, ($Width + 14))
	$shadow.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
	$shadow.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
	$shadow.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
	$g.DrawLines($shadow, $Points)
	$shadow.Dispose()

	$brush = New-GoldBrush ([System.Drawing.Rectangle]::new(110, 138, 300, 250)) 55
	$pen = New-Object System.Drawing.Pen($brush, $Width)
	$pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
	$pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
	$pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
	$g.DrawLines($pen, $Points)
	$pen.Dispose(); $brush.Dispose()
}

function Draw-Highlights {
	param($g)
	$hiColor = [System.Drawing.Color]::FromArgb(145, 255, 246, 173)
	$hi = New-Object System.Drawing.Pen($hiColor, 9)
	$hi.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
	$hi.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
	$g.DrawLine($hi, 146, 172, 190, 314)
	$g.DrawLine($hi, 260, 232, 322, 337)
	$g.DrawLine($hi, 369, 172, 329, 314)
	$hi.Dispose()
}

function Draw-Spot {
	param($g, [int]$Cx = 256, [int]$Cy = 228, [int]$R = 20)
	$brush = New-GoldBrush ([System.Drawing.Rectangle]::new($Cx - $R, $Cy - $R, $R * 2, $R * 2)) 45
	$g.FillEllipse($brush, $Cx - $R, $Cy - $R, $R * 2, $R * 2)
	$brush.Dispose()
	$dark = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 8, 10, 28))
	$light = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 244, 170))
	$g.FillEllipse($dark, $Cx - 9, $Cy - 9, 18, 18)
	$g.FillEllipse($light, $Cx - 4, $Cy - 4, 8, 8)
	$dark.Dispose(); $light.Dispose()
}

function Draw-Option1 {
	$c = New-Canvas; $g = $c.Graphics; $bmp = $c.Bitmap
	Draw-DarkDisc $g; Draw-GoldRing $g
	$innerColor = [System.Drawing.Color]::FromArgb(150, 212, 175, 55)
	$inner = New-Object System.Drawing.Pen($innerColor, 3)
	$g.DrawEllipse($inner, 89, 89, 334, 334); $inner.Dispose()

	# Distinctiveness: gold orbit + upward property roof arc.
	$orbit = New-Object System.Drawing.Drawing2D.GraphicsPath
	$orbit.AddBezier(95, 285, 165, 175, 342, 165, 425, 260)
	$orbitColor = [System.Drawing.Color]::FromArgb(120, 212, 175, 55)
	$orbitPen = New-Object System.Drawing.Pen($orbitColor, 5)
	$orbitPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round; $orbitPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
	$g.DrawPath($orbitPen, $orbit); $orbit.Dispose(); $orbitPen.Dispose()
	$g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 239, 145))), 401, 246, 15, 15)

	$w = [System.Drawing.PointF[]]@([System.Drawing.PointF]::new(130,166),[System.Drawing.PointF]::new(188,352),[System.Drawing.PointF]::new(256,229),[System.Drawing.PointF]::new(324,352),[System.Drawing.PointF]::new(382,166))
	Draw-W $g $w 48; Draw-Highlights $g; Draw-Spot $g 256 228 20
	Save-Option $bmp "wealthspot-logo-option-1.png"
	$g.Dispose(); $bmp.Dispose()
}

function Draw-Option2 {
	$c = New-Canvas; $g = $c.Graphics; $bmp = $c.Bitmap
	# Distinctiveness: vault/shield crest with 7 due-diligence layer markers.
	$shield = New-Object System.Drawing.Drawing2D.GraphicsPath
	$shield.StartFigure()
	$shield.AddBezier(256, 43, 315, 74, 377, 87, 431, 94)
	$shield.AddLine(431, 94, 431, 223)
	$shield.AddBezier(431, 223, 431, 332, 361, 421, 256, 470)
	$shield.AddBezier(256, 470, 151, 421, 81, 332, 81, 223)
	$shield.AddLine(81, 223, 81, 94)
	$shield.AddBezier(81, 94, 135, 87, 197, 74, 256, 43)
	$shield.CloseFigure()
	$shieldBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($shield)
	$shieldBrush.CenterPoint = [System.Drawing.PointF]::new(238, 175)
	$shieldBrush.CenterColor = [System.Drawing.Color]::FromArgb(255, 31, 27, 67)
	$shieldBrush.SurroundColors = [System.Drawing.Color[]]@([System.Drawing.Color]::FromArgb(255, 4, 6, 18))
	$g.FillPath($shieldBrush, $shield)
	$shieldBrush.Dispose()
	$outlineBrush = New-GoldBrush ([System.Drawing.Rectangle]::new(72, 40, 370, 440)) 45
	$outline = New-Object System.Drawing.Pen($outlineBrush, 14)
	$outline.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
	$g.DrawPath($outline, $shield)
	$outline.Dispose(); $outlineBrush.Dispose(); $shield.Dispose()

	for ($i = 0; $i -lt 7; $i++) {
		$ang = (-120 + $i * 40) * [Math]::PI / 180
		$x = 256 + [Math]::Cos($ang) * 151
		$y = 270 + [Math]::Sin($ang) * 151
		$dot = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(185, 212, 175, 55))
		$g.FillEllipse($dot, [float]($x - 4), [float]($y - 4), 8, 8)
		$dot.Dispose()
	}

	$w = [System.Drawing.PointF[]]@([System.Drawing.PointF]::new(132,166),[System.Drawing.PointF]::new(188,356),[System.Drawing.PointF]::new(256,224),[System.Drawing.PointF]::new(324,356),[System.Drawing.PointF]::new(380,166))
	Draw-W $g $w 47; Draw-Highlights $g; Draw-Spot $g 256 224 19
	Save-Option $bmp "wealthspot-logo-option-2.png"
	$g.Dispose(); $bmp.Dispose()
}

function Draw-Option3 {
	$c = New-Canvas; $g = $c.Graphics; $bmp = $c.Bitmap
	Draw-DarkDisc $g 62 62 388; Draw-GoldRing $g 72 72 368 12
	# Distinctiveness: diamond/gem facets + skyline/property growth line.
	$facetColor = [System.Drawing.Color]::FromArgb(70, 212, 175, 55)
	$facetPen = New-Object System.Drawing.Pen($facetColor, 2)
	$g.DrawLine($facetPen, 256, 80, 256, 432)
	$g.DrawLine($facetPen, 98, 256, 414, 256)
	$g.DrawLine($facetPen, 145, 145, 367, 367)
	$g.DrawLine($facetPen, 367, 145, 145, 367)
	$facetPen.Dispose()
	$diamondBrush = New-GoldBrush ([System.Drawing.Rectangle]::new(92, 92, 328, 328)) 45
	$diamondPen = New-Object System.Drawing.Pen($diamondBrush, 4)
	$diamondPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
	$diamondPts = [System.Drawing.PointF[]]@([System.Drawing.PointF]::new(256,86),[System.Drawing.PointF]::new(426,256),[System.Drawing.PointF]::new(256,426),[System.Drawing.PointF]::new(86,256),[System.Drawing.PointF]::new(256,86))
	$g.DrawLines($diamondPen, $diamondPts)
	$diamondPen.Dispose(); $diamondBrush.Dispose()

	$lineColor = [System.Drawing.Color]::FromArgb(120, 255, 237, 140)
	$linePen = New-Object System.Drawing.Pen($lineColor, 5)
	$linePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round; $linePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
	$growth = [System.Drawing.PointF[]]@([System.Drawing.PointF]::new(146,163),[System.Drawing.PointF]::new(194,132),[System.Drawing.PointF]::new(239,151),[System.Drawing.PointF]::new(292,113),[System.Drawing.PointF]::new(366,149))
	$g.DrawLines($linePen, $growth); $linePen.Dispose()

	$w = [System.Drawing.PointF[]]@([System.Drawing.PointF]::new(128,178),[System.Drawing.PointF]::new(184,360),[System.Drawing.PointF]::new(256,214),[System.Drawing.PointF]::new(328,360),[System.Drawing.PointF]::new(384,178))
	Draw-W $g $w 46; Draw-Highlights $g; Draw-Spot $g 256 214 18
	Save-Option $bmp "wealthspot-logo-option-3.png"
	$g.Dispose(); $bmp.Dispose()
}

function Draw-LuxuryW {
	param($g, [string]$FamilyName, [float]$EmSize, [float]$X, [float]$Y, [int]$Outline = 7)
	$family = New-Object System.Drawing.FontFamily($FamilyName)
	$format = [System.Drawing.StringFormat]::GenericTypographic
	$path = New-Object System.Drawing.Drawing2D.GraphicsPath
	$path.AddString("W", $family, [int][System.Drawing.FontStyle]::Bold, $EmSize, [System.Drawing.PointF]::new($X, $Y), $format)

	$shadowPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(135, 12, 8, 2), ($Outline + 11))
	$shadowPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
	$g.DrawPath($shadowPen, $path)
	$shadowPen.Dispose()

	$outlineBrush = New-GoldBrush ([System.Drawing.Rectangle]::new(112, 130, 292, 275)) 42
	$outlinePen = New-Object System.Drawing.Pen($outlineBrush, $Outline)
	$outlinePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
	$g.DrawPath($outlinePen, $path)
	$outlinePen.Dispose(); $outlineBrush.Dispose()

	$fillBrush = New-GoldBrush ([System.Drawing.Rectangle]::new(112, 130, 292, 275)) 65
	$g.FillPath($fillBrush, $path)
	$fillBrush.Dispose()

	$hiPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, 255, 246, 178), 3)
	$hiPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
	$g.DrawPath($hiPen, $path)
	$hiPen.Dispose()

	$path.Dispose(); $family.Dispose()
}

function Draw-Enhanced2A {
	$c = New-Canvas; $g = $c.Graphics; $bmp = $c.Bitmap
	# Royal Shield Vault: richer shield, enamel base, seven-layer diligence constellation.
	$shield = New-Object System.Drawing.Drawing2D.GraphicsPath
	$shield.StartFigure()
	$shield.AddBezier(256, 42, 322, 76, 380, 88, 432, 94)
	$shield.AddLine(432, 94, 432, 220)
	$shield.AddBezier(432, 220, 428, 345, 347, 431, 256, 473)
	$shield.AddBezier(256, 473, 165, 431, 84, 345, 80, 220)
	$shield.AddLine(80, 220, 80, 94)
	$shield.AddBezier(80, 94, 132, 88, 190, 76, 256, 42)
	$shield.CloseFigure()
	$shieldBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($shield)
	$shieldBrush.CenterPoint = [System.Drawing.PointF]::new(240, 160)
	$shieldBrush.CenterColor = [System.Drawing.Color]::FromArgb(255, 32, 28, 75)
	$shieldBrush.SurroundColors = [System.Drawing.Color[]]@([System.Drawing.Color]::FromArgb(255, 3, 5, 18))
	$g.FillPath($shieldBrush, $shield); $shieldBrush.Dispose()
	$outlineBrush = New-GoldBrush ([System.Drawing.Rectangle]::new(70, 38, 374, 446)) 50
	$outline = New-Object System.Drawing.Pen($outlineBrush, 16)
	$outline.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
	$g.DrawPath($outline, $shield); $outline.Dispose(); $outlineBrush.Dispose()
	$inner = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(115, 212, 175, 55), 3)
	$inner.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
	$g.DrawPath($inner, $shield); $inner.Dispose()

	$starBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(205, 255, 236, 137))
	$coords = @(@(184,165),@(226,135),@(287,137),@(334,170),@(356,235),@(314,304),@(197,304))
	foreach ($p in $coords) { $g.FillEllipse($starBrush, [int]$p[0], [int]$p[1], 7, 7) }
	$starBrush.Dispose()

	Draw-LuxuryW $g "Constantia" 250 119 149 7
	Draw-Spot $g 256 235 17
	$shield.Dispose()
	Save-Option $bmp "wealthspot-logo-option-2a.png"
	$g.Dispose(); $bmp.Dispose()
}

function Draw-Enhanced3A {
	$c = New-Canvas; $g = $c.Graphics; $bmp = $c.Bitmap
	# Diamond Estate Growth: gemstone geometry, estate roofline, angular luxury W.
	Draw-DarkDisc $g 58 58 396
	$diamondBrush = New-GoldBrush ([System.Drawing.Rectangle]::new(62, 62, 388, 388)) 45
	$diamondPen = New-Object System.Drawing.Pen($diamondBrush, 8)
	$diamondPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
	$outer = [System.Drawing.PointF[]]@([System.Drawing.PointF]::new(256,58),[System.Drawing.PointF]::new(454,256),[System.Drawing.PointF]::new(256,454),[System.Drawing.PointF]::new(58,256),[System.Drawing.PointF]::new(256,58))
	$g.DrawLines($diamondPen, $outer)
	$diamondPen.Dispose(); $diamondBrush.Dispose()

	$facet = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(92, 255, 224, 112), 2)
	$facet.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
	$facetLines = @(@(256,58,256,454),@(58,256,454,256),@(133,133,379,379),@(379,133,133,379),@(256,58,379,256),@(256,58,133,256),@(256,454,379,256),@(256,454,133,256))
	foreach ($l in $facetLines) { $g.DrawLine($facet, $l[0], $l[1], $l[2], $l[3]) }
	$facet.Dispose()

	$growthBrush = New-GoldBrush ([System.Drawing.Rectangle]::new(140, 96, 236, 82)) 18
	$growthPen = New-Object System.Drawing.Pen($growthBrush, 7)
	$growthPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round; $growthPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round; $growthPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
	$growth = [System.Drawing.PointF[]]@([System.Drawing.PointF]::new(140,170),[System.Drawing.PointF]::new(190,130),[System.Drawing.PointF]::new(234,151),[System.Drawing.PointF]::new(292,105),[System.Drawing.PointF]::new(374,145))
	$g.DrawLines($growthPen, $growth); $growthPen.Dispose(); $growthBrush.Dispose()

	Draw-LuxuryW $g "Baskerville Old Face" 252 112 150 6
	Draw-Spot $g 256 229 17
	Save-Option $bmp "wealthspot-logo-option-3a.png"
	$g.Dispose(); $bmp.Dispose()
}

function Draw-Enhanced4A {
	$c = New-Canvas; $g = $c.Graphics; $bmp = $c.Bitmap
	# Shield Diamond Hybrid: most complete brand mark — trust shield plus diamond/exclusive asset facets.
	$bgPath = New-Object System.Drawing.Drawing2D.GraphicsPath
	$bgPath.AddEllipse(50, 50, 412, 412)
	$bgBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($bgPath)
	$bgBrush.CenterColor = [System.Drawing.Color]::FromArgb(255, 36, 29, 83)
	$bgBrush.SurroundColors = [System.Drawing.Color[]]@([System.Drawing.Color]::FromArgb(255, 4, 5, 16))
	$g.FillEllipse($bgBrush, 50, 50, 412, 412); $bgBrush.Dispose(); $bgPath.Dispose()
	Draw-GoldRing $g 58 58 396 13
	$shieldPenBrush = New-GoldBrush ([System.Drawing.Rectangle]::new(92, 62, 328, 400)) 45
	$shieldPen = New-Object System.Drawing.Pen($shieldPenBrush, 7)
	$shieldPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
	$shieldPts = [System.Drawing.PointF[]]@([System.Drawing.PointF]::new(256,80),[System.Drawing.PointF]::new(395,128),[System.Drawing.PointF]::new(390,262),[System.Drawing.PointF]::new(256,430),[System.Drawing.PointF]::new(122,262),[System.Drawing.PointF]::new(117,128),[System.Drawing.PointF]::new(256,80))
	$g.DrawLines($shieldPen, $shieldPts)
	$shieldPen.Dispose(); $shieldPenBrush.Dispose()

	$diamondPenBrush = New-GoldBrush ([System.Drawing.Rectangle]::new(112, 112, 288, 288)) 45
	$diamondPen = New-Object System.Drawing.Pen($diamondPenBrush, 4)
	$diamondPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
	$diamond = [System.Drawing.PointF[]]@([System.Drawing.PointF]::new(256,106),[System.Drawing.PointF]::new(406,256),[System.Drawing.PointF]::new(256,406),[System.Drawing.PointF]::new(106,256),[System.Drawing.PointF]::new(256,106))
	$g.DrawLines($diamondPen, $diamond); $diamondPen.Dispose(); $diamondPenBrush.Dispose()
	$facetPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70, 255, 224, 112), 2)
	$g.DrawLine($facetPen, 256, 106, 256, 406); $g.DrawLine($facetPen, 106, 256, 406, 256); $g.DrawLine($facetPen, 152, 152, 360, 360); $g.DrawLine($facetPen, 360, 152, 152, 360); $facetPen.Dispose()

	Draw-LuxuryW $g "Cambria" 252 112 151 7
	Draw-Spot $g 256 229 17
	# Three small premium asset sparkles.
	$spark = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 255, 240, 150))
	$g.FillEllipse($spark, 168, 170, 7, 7); $g.FillEllipse($spark, 340, 174, 6, 6); $g.FillEllipse($spark, 352, 305, 5, 5)
	$spark.Dispose()
	Save-Option $bmp "wealthspot-logo-option-4a.png"
	$g.Dispose(); $bmp.Dispose()
}

Draw-Option1
Draw-Option2
Draw-Option3
Draw-Enhanced2A
Draw-Enhanced3A
Draw-Enhanced4A
Write-Host "Generated logo options: wealthspot-logo-option-1.png, wealthspot-logo-option-2.png, wealthspot-logo-option-3.png, wealthspot-logo-option-2a.png, wealthspot-logo-option-3a.png, wealthspot-logo-option-4a.png"
