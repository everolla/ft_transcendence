import fastifyOauth2 from '@fastify/oauth2';

export default async function (fastify) {
  fastify.register(fastifyOauth2, {
    name: 'googleOAuth2',
    scope: ['profile', 'email'], // Changed to get profile and email info
    credentials: {
      client: {
        id: fastify.env.googleClientId,
        secret: fastify.env.googleClientSecret
      },
      auth: fastifyOauth2.GOOGLE_CONFIGURATION
    },
    startRedirectPath: '/login/google',
    callbackUri: 'http://localhost:3000/login/google/callback'
  });

  // Route di callback per Google OAuth2
  fastify.get('/login/google/callback', async (req, reply) => {
    try {
      // Get access token from Google
      const { token } = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);
      
      // Fetch user profile from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${token.access_token}`
        }
      });

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user info from Google');
      }

      const googleUser = await userInfoResponse.json();
      console.log('[oauth] Google user info:', googleUser);

      // Check if user already exists in database
      let user = await fastify.models.User.findOne({ 
        where: { email: googleUser.email } 
      });

      if (user) {
        // User exists - update info if needed
        console.log('[oauth] Existing user found:', user.username);
        
        // Update user info from Google if changed
        await user.update({
          // Only update if avatar is still default
          ...(user.avatar === "public/avatars/default.png" && googleUser.picture ? 
            { avatar: googleUser.picture } : {}),
          is_online: true
        });
      } else {
        // Create new user from Google profile
        console.log('[oauth] Creating new user from Google profile');
        
        // Generate username from Google name or email
        let username = googleUser.name?.replace(/\s+/g, '_').toLowerCase() || 
                      googleUser.email.split('@')[0];
        
        // Ensure username is unique
        let baseUsername = username;
        let counter = 1;
        while (await fastify.models.User.findOne({ where: { username } })) {
          username = `${baseUsername}_${counter}`;
          counter++;
        }

        user = await fastify.models.User.create({
          username,
          email: googleUser.email,
          password: 'OAUTH_USER', // Placeholder for OAuth users
          avatar: googleUser.picture || "",
          is_online: true
        });

        console.log('[oauth] New user created:', user.username);
      }
      
      console.log('[oauth] Session created for user:', user.username);

      const accessToken = fastify.jwt.sign(
        { id: user.id, username: user.username, email: user.email }, 
        { expiresIn: '15m' }
      )

      const refreshToken = fastify.jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        { expiresIn: '7d' }
      )

      // Store refresh token in database
      await user.update({ refresh_token: refreshToken })

      // Set refresh token as HTTP-only cookie
      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      })

      // Redirect to success page or return user info
      reply.send({ 
        message: 'Login successful',
        jwt: accessToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar
        }
      });

    } catch (error) {
      console.error('[oauth] Error during Google OAuth callback:', error);
      reply.code(500).send({ error: 'OAuth authentication failed' });
    }
  });
}