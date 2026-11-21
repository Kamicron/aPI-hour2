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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger(JwtFilter.class);

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
        log.warn("JWT refuse sur {} : {}", request.getRequestURI(), e.getClass().getSimpleName());
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
        } else {
          log.warn("JWT non valide pour {} (sujet ou expiration)", request.getRequestURI());
        }
      } catch (Exception e) {
        // Erreur de validation - on continue sans authentification
        log.warn("JWT erreur de validation sur {} : {}", request.getRequestURI(), e.toString());
      }
    }

    filterChain.doFilter(request, response);
  }

}
