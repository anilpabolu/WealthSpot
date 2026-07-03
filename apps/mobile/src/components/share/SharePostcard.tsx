import React from 'react';
import { View, Text, ImageBackground, Image, useWindowDimensions, StyleSheet } from 'react-native';
import { Building2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import WLogo3D from '@/components/ui/WLogo3D';

interface SharePostcardProps {
  title: string;
  tenure?: string;
  minEntry?: string;
  coverImage?: string;
  city?: string;
  url: string;
  containerWidth?: number; // Optional override
}

export const SharePostcard = ({
  title,
  tenure,
  minEntry,
  coverImage,
  city,
  url,
  containerWidth: overrideWidth,
}: SharePostcardProps) => {
  const windowWidth = useWindowDimensions().width;
  // Default to full width minus some padding if not provided
  const width = overrideWidth || (windowWidth - 32); 
  const height = width * (630 / 1200);
  
  // Scale function based on original 1200px width
  const s = (val: number) => (val / 1200) * width;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${Math.round(s(150))}x${Math.round(s(150))}&data=${encodeURIComponent(url)}`;

  return (
    <View 
      style={{
        width,
        height,
        backgroundColor: '#020617', // slate-950
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Outer Border wrapper */}
      <View 
        style={[
          StyleSheet.absoluteFillObject,
          { borderWidth: s(8), borderColor: '#020617', zIndex: 60 }
        ]} 
        pointerEvents="none"
      />
      
      {/* Inner Elegant Gold Border */}
      <View 
        style={{
          position: 'absolute',
          top: s(8), bottom: s(8), left: s(8), right: s(8),
          borderWidth: s(2),
          borderColor: 'rgba(212,175,55,0.8)',
          borderRadius: s(4),
          zIndex: 50,
        }}
        pointerEvents="none"
      />

      {/* Background Image Container */}
      <View style={{
        position: 'absolute',
        top: s(8), bottom: s(8), left: s(8), right: s(8),
        borderRadius: s(4),
        backgroundColor: '#0f172a', // slate-900
        overflow: 'hidden',
      }}>
        {coverImage ? (
          <ImageBackground
            source={{ uri: `https://wsrv.nl/?url=${encodeURIComponent(coverImage)}` }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          >
            {/* Gradients to ensure text readability */}
            <LinearGradient
              colors={['transparent', 'rgba(2,6,23,0.8)', 'rgba(2,6,23,1)']}
              style={StyleSheet.absoluteFillObject}
            />
          </ImageBackground>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={s(192)} color="rgba(255,255,255,0.2)" />
            <LinearGradient
              colors={['transparent', 'rgba(2,6,23,0.8)', 'rgba(2,6,23,1)']}
              style={StyleSheet.absoluteFillObject}
            />
          </View>
        )}
      </View>

      {/* Top Branding */}
      <View style={{
        position: 'absolute',
        top: s(48),
        left: s(56),
        zIndex: 50,
        flexDirection: 'row',
        alignItems: 'center',
        gap: s(8),
      }}>
        <View style={{ width: s(80), height: s(80), justifyContent: 'center', alignItems: 'center' }}>
           <WLogo3D size={s(80)} light={true} />
        </View>
        <View>
          <Text style={{
            color: 'white',
            fontFamily: 'serif',
            fontWeight: 'bold',
            fontSize: s(40),
            letterSpacing: s(1.5),
          }}>
            Wealth<Text style={{ color: '#D4AF37' }}>Spot</Text>
          </Text>
          <Text style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: s(13),
            fontWeight: '600',
            letterSpacing: s(2.6),
            marginTop: s(4),
          }}>
            RESEARCH. EVALUATE. INVEST.
          </Text>
          <View style={{ height: 1, width: s(48), backgroundColor: 'rgba(212,175,55,0.5)', marginTop: s(10) }} />
        </View>
      </View>

      {/* Shield Certified Badge */}
      <View style={{
        position: 'absolute',
        top: s(48),
        right: s(56),
        zIndex: 50,
        flexDirection: 'row',
        alignItems: 'center',
        gap: s(8),
        backgroundColor: 'rgba(15,23,42,0.8)',
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.4)',
        paddingHorizontal: s(16),
        paddingVertical: s(8),
        borderRadius: s(999),
      }}>
        <View style={{ width: s(8), height: s(8), borderRadius: s(4), backgroundColor: '#D4AF37' }} />
        <Text style={{ color: '#D4AF37', fontSize: s(12), fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: s(1.5) }}>
          Shield Certified
        </Text>
      </View>

      {/* Bottom Content Area */}
      <View style={{
        position: 'absolute',
        bottom: s(32), left: s(32), right: s(32),
        zIndex: 50,
        padding: s(32),
        backgroundColor: 'rgba(2,6,23,0.75)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: s(16),
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
      }}>
        <View style={{ flex: 1, paddingRight: s(48), maxWidth: width * 0.7 }}>
          {city && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(10), marginBottom: s(16) }}>
              <View style={{ width: s(32), height: 1, backgroundColor: '#D4AF37' }} />
              <Text style={{ color: '#D4AF37', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: s(1.5), fontSize: s(14) }}>
                {city}
              </Text>
            </View>
          )}
          
          <Text 
            numberOfLines={2}
            style={{
              fontSize: s(64),
              fontWeight: 'bold',
              color: 'white',
              marginBottom: s(32),
              fontFamily: 'BricolageGrotesque-Bold',
            }}
          >
            {title}
          </Text>

          {/* Metrics Grid */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: s(48),
            backgroundColor: 'rgba(15,23,42,0.6)',
            padding: s(32),
            borderRadius: s(16),
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            alignSelf: 'flex-start',
          }}>
            <View>
              <Text style={{ fontSize: s(11), fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: s(1.6), color: '#D4AF37', marginBottom: s(8) }}>
                Tenure
              </Text>
              <Text style={{ fontSize: s(48), fontWeight: 'bold', color: 'white', fontFamily: 'BricolageGrotesque-Bold' }}>
                {tenure ?? 'TBD'}
              </Text>
            </View>

            <View style={{ width: 1, height: s(64), backgroundColor: 'rgba(212,175,55,0.3)' }} />

            <View>
              <Text style={{ fontSize: s(11), fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: s(1.6), color: '#D4AF37', marginBottom: s(8) }}>
                Min. Entry
              </Text>
              <Text style={{ fontSize: s(48), fontWeight: 'bold', color: 'white', fontFamily: 'BricolageGrotesque-Bold' }}>
                {minEntry ?? 'TBD'}
              </Text>
            </View>
          </View>
        </View>

        {/* QR Code Section */}
        <View style={{
          alignItems: 'center',
          backgroundColor: 'white',
          padding: s(16),
          borderRadius: s(12),
          borderWidth: s(3),
          borderColor: '#D4AF37',
        }}>
          <Image 
            source={{ uri: qrCodeUrl }} 
            style={{ width: s(120), height: s(120) }} 
            resizeMode="cover" 
          />
          <View style={{ width: '100%', height: 1, backgroundColor: '#e2e8f0', marginTop: s(12), marginBottom: s(8) }} />
          <Text style={{ color: '#0f172a', fontSize: s(9), fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: s(2), textAlign: 'center' }}>
            Scan to View{'\n'}Investment
          </Text>
        </View>
      </View>
    </View>
  );
};

export default SharePostcard;
