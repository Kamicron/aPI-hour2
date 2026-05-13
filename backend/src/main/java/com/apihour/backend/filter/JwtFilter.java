package com.apihour.backend.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import com.apihour.backend.config.JwtUtils;
import com.apihour.backend.service.UserService;

import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {

  private final UserService userService;
  private final JwtUtils jwtUtil;

  public JwtFilter(UserService userService, JwtUtils jwtUtil) {
    this.userService = userService;
    this.jwtUtil = jwtUtil;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    final String authHeader = request.getHeader("Authorization");

    String username = null;
    String jwtToken = null;

    if (authHeader != null && authHeader.startsWith("Bearer ")) {
      jwtToken = authHeader.substring(7);
      try {
        username = jwtUtil.extractUsername(jwtToken);
      } catch (Exception e) {
        // Token invalide ou expiré - on continue sans authentification
        filterChain.doFilter(request, response);
        return;
      }
    }

    if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
      try {
        UserDetails userDetails = this.userService.loadUserByUsername(username);
        if (jwtUtil.validateToken(jwtToken, userDetails)) {
          UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
              userDetails,
              null,
              userDetails.getAuthorities());
          authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
          SecurityContextHolder.getContext().setAuthentication(authToken);
        }
      } catch (Exception e) {
        // Erreur de validation - on continue sans authentification
      }
    }

    filterChain.doFilter(request, response);
  }

}
