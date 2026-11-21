package com.apihour.backend.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import javax.crypto.spec.SecretKeySpec;

@Component
public class JwtUtils {
  @Value("${jwt.secret}")
  private String secretKey;

  @Value("${jwt.expiration}")
  private long expirationTime;

  @Value("${jwt.refresh.expiration}")
  private long refreshExpirationTime;

  public String generateToken(String username) {
    Map<String, Object> claims = new HashMap<>();
    return createToken(claims, username, expirationTime);
  }

  public String generateRefreshToken(String username) {
    Map<String, Object> claims = new HashMap<>();
    return createToken(claims, username, refreshExpirationTime);
  }

  private String createToken(Map<String, Object> claims, String username, long expiration) {
    return Jwts.builder()
        .setClaims(claims)
        .setSubject(username)
        .setIssuedAt(new Date(System.currentTimeMillis()))
        .setExpiration(new Date(System.currentTimeMillis() + expiration))
        .signWith(getSignKey(), SignatureAlgorithm.HS512)
        .compact();
  }

  private Key getSignKey() {
    byte[] keyBytes = secretKey.getBytes();
    return new SecretKeySpec(keyBytes, SignatureAlgorithm.HS512.getJcaName());
  }

  public Boolean validateToken(String token, UserDetails userDetails) {
    String username = extractUsername(token);
    return (username.equalsIgnoreCase(userDetails.getUsername()) && !isTokenExpired(token));
  }

  /** Diagnostic sans donnees sensibles : pourquoi un token est refuse. */
  public String diagnose(String token, UserDetails userDetails) {
    try {
      String subject = extractUsername(token);
      Date exp = extractExpiration(token);
      Date iat = extractClaim(token, Claims::getIssuedAt);
      return "sujetIdentique=" + subject.equals(userDetails.getUsername())
          + " sujetIdentiqueSansCasse=" + subject.equalsIgnoreCase(userDetails.getUsername())
          + " expire=" + exp.before(new Date())
          + " iat=" + iat + " exp=" + exp + " maintenant=" + new Date();
    } catch (Exception e) {
      return "diagnostic impossible : " + e;
    }
  }

  public String extractUsername(String token) {
    return extractClaim(token, Claims::getSubject);
  }

  private Date extractExpiration(String token) {
    return extractClaim(token, Claims::getExpiration);
  }

  private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
    final Claims claims = extractAllClaims(token);
    return claimsResolver.apply(claims);
  }

  private Claims extractAllClaims(String token) {
    return Jwts.parserBuilder().setSigningKey(getSignKey()).build().parseClaimsJws(token).getBody();
  }

  private Boolean isTokenExpired(String token) {
    return extractExpiration(token).before(new Date());
  }
}
