import { googlePictureUrl } from 'models/google-avatar';

describe('googlePictureUrl', () => {
  it('accepts Google image hosts over https and asks for 512 px', () => {
    expect(
      googlePictureUrl('https://lh3.googleusercontent.com/a/abc123=s96-c'),
    ).toBe('https://lh3.googleusercontent.com/a/abc123=s512-c');
    expect(googlePictureUrl('https://lh3.googleusercontent.com/a/abc123')).toBe(
      'https://lh3.googleusercontent.com/a/abc123',
    );
  });

  it('rejects other hosts, schemes and lookalikes', () => {
    for (const bad of [
      'http://lh3.googleusercontent.com/a/abc',
      'https://evil.com/a.png',
      'https://googleusercontent.com.evil.com/a.png',
      'https://evilgoogleusercontent.com/a.png',
      'https://user:pass@lh3.googleusercontent.com/a.png',
      'https://lh3.googleusercontent.com:8443/a.png',
      'http://169.254.169.254/latest/meta-data',
      'not a url',
      '',
      undefined,
      42,
    ])
      expect(googlePictureUrl(bad)).toBeNull();
  });
});
